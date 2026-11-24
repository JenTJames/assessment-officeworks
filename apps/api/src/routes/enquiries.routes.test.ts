import {
  enquiryResponseSchema,
  errorResponseSchema,
  honeypotFieldName,
} from "@catalogue/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.ts";
import { EmailUnavailableError } from "../errors/email-unavailable-error.ts";
import { createRecordingMailer } from "../test-support/recording-mailer.ts";
import { buildTestContainer, testSalesInbox } from "../test-support/test-container.ts";

const enquiry = { productId: "3", name: "Ada Lovelace", email: "ada@example.com" };

function setup(options: Parameters<typeof buildTestContainer>[0] = {}) {
  const mailer = createRecordingMailer();
  const app = buildApp(buildTestContainer({ mailer, ...options }));
  return { app, mailer };
}

describe("POST /api/v1/enquiries", () => {
  it("accepts a valid enquiry and emails the sales inbox", async () => {
    const { app, mailer } = setup();

    const response = await request(app).post("/api/v1/enquiries").send(enquiry);

    expect(response.status).toBe(202);
    expect(enquiryResponseSchema.parse(response.body)).toEqual({ status: "received" });
    expect(mailer.sent).toEqual([
      expect.objectContaining({
        to: testSalesInbox,
        subject: "Product enquiry: Mens Cotton Jacket",
      }),
    ]);
  });

  it("returns 400 with field errors for an invalid enquiry", async () => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post("/api/v1/enquiries")
      .send({ productId: "3", name: " ", email: "nope" });

    expect(response.status).toBe(400);
    const { error } = errorResponseSchema.parse(response.body);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fields).toHaveProperty("name");
    expect(error.fields).toHaveProperty("email");
    expect(mailer.sent).toHaveLength(0);
  });

  it("returns 400 for a product that does not exist", async () => {
    const { app } = setup();

    const response = await request(app)
      .post("/api/v1/enquiries")
      .send({ ...enquiry, productId: "999" });

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.fields).toHaveProperty("productId");
  });

  it("pretends to accept a bot submission without sending email", async () => {
    const { app, mailer } = setup();

    const response = await request(app)
      .post("/api/v1/enquiries")
      .send({ ...enquiry, [honeypotFieldName]: "https://spam.example" });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ status: "received" });
    expect(mailer.sent).toHaveLength(0);
  });

  it("treats a blank honeypot as a real submission", async () => {
    const { app, mailer } = setup();

    await request(app)
      .post("/api/v1/enquiries")
      .send({ ...enquiry, [honeypotFieldName]: "" });

    expect(mailer.sent).toHaveLength(1);
  });

  it("rate limits repeated enquiries with the error envelope", async () => {
    const { app, mailer } = setup({ enquiryRateLimit: { limit: 2, windowMs: 60_000 } });

    await request(app).post("/api/v1/enquiries").send(enquiry);
    await request(app).post("/api/v1/enquiries").send(enquiry);
    const response = await request(app).post("/api/v1/enquiries").send(enquiry);

    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("RATE_LIMITED");
    expect(response.headers).toHaveProperty("ratelimit");
    expect(mailer.sent).toHaveLength(2);
  });

  it("rate limits each client separately behind a trusted proxy", async () => {
    const { app } = setup({
      enquiryRateLimit: { limit: 1, windowMs: 60_000 },
      trustProxyHops: 1,
    });

    await request(app)
      .post("/api/v1/enquiries")
      .set("X-Forwarded-For", "203.0.113.1")
      .send(enquiry);
    const otherClient = await request(app)
      .post("/api/v1/enquiries")
      .set("X-Forwarded-For", "203.0.113.2")
      .send(enquiry);
    const sameClient = await request(app)
      .post("/api/v1/enquiries")
      .set("X-Forwarded-For", "203.0.113.1")
      .send(enquiry);

    expect(otherClient.status).toBe(202);
    expect(sameClient.status).toBe(429);
  });

  it("does not rate limit catalogue endpoints", async () => {
    const { app } = setup({ enquiryRateLimit: { limit: 1, windowMs: 60_000 } });

    await request(app).post("/api/v1/enquiries").send(enquiry);
    const response = await request(app).get("/api/v1/products/3");

    expect(response.status).toBe(200);
  });

  it("returns 503 when the email cannot be sent", async () => {
    const { app } = setup({
      mailer: createRecordingMailer(new EmailUnavailableError(new Error("SMTP down"))),
    });

    const response = await request(app).post("/api/v1/enquiries").send(enquiry);

    expect(response.status).toBe(503);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("EMAIL_UNAVAILABLE");
  });
});
