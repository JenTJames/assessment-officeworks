import { errorResponseSchema } from "@catalogue/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";
import { buildTestContainer } from "./test-support/test-container.ts";

const app = buildApp(buildTestContainer());

describe("app", () => {
  it("reports health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns the error envelope for unknown routes", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("NOT_FOUND");
  });

  it("returns a 400 error envelope for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/anything")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("BAD_REQUEST");
  });

  it("sets security headers", async () => {
    const response = await request(app).get("/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});
