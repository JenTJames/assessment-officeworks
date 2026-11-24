import type { EnquiryRequest } from "@catalogue/contracts";
import { describe, expect, it } from "vitest";
import { EmailUnavailableError } from "../../errors/email-unavailable-error.ts";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import type { ProductFeed } from "../../ports/product-feed.ts";
import { buildProduct, mensClothing } from "../../test-support/products.ts";
import { createRecordingMailer } from "../../test-support/recording-mailer.ts";
import { staticProductFeed } from "../../test-support/test-container.ts";
import { createInMemoryProductSource } from "../catalogue/in-memory-product-source.ts";
import { createEnquiryService } from "./enquiry-service.ts";

const salesInbox = "sales@catalogue.test";

const jacket = buildProduct({
  id: "3",
  title: "Mens Cotton Jacket",
  category: mensClothing,
  price: { minorUnits: 5599, currency: "USD" },
});

const enquiry: EnquiryRequest = {
  productId: "3",
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+61 2 9999 0000",
  message: "Is this available in navy?",
};

function buildService(feed: ProductFeed = staticProductFeed([jacket])) {
  const mailer = createRecordingMailer();
  const service = createEnquiryService({
    productSource: createInMemoryProductSource(feed),
    mailer,
    salesInbox,
  });
  return { service, mailer };
}

describe("enquiry service", () => {
  it("emails the sales inbox with the product and customer details", async () => {
    const { service, mailer } = buildService();

    await expect(service.submitEnquiry(enquiry)).resolves.toEqual({ status: "received" });

    expect(mailer.sent).toHaveLength(1);
    const [email] = mailer.sent;
    expect(email).toMatchObject({
      to: salesInbox,
      replyTo: { name: "Ada Lovelace", address: "ada@example.com" },
      subject: "Product enquiry: Mens Cotton Jacket",
    });
    expect(email?.text).toContain("ID: 3");
    expect(email?.text).toContain("Category: Men's clothing");
    expect(email?.text).toContain("Price: USD 55.99");
    expect(email?.text).toContain("Phone: +61 2 9999 0000");
    expect(email?.text).toContain("Is this available in navy?");
  });

  it("marks missing optional details as not provided", async () => {
    const { service, mailer } = buildService();

    await service.submitEnquiry({ ...enquiry, phone: "", message: undefined });

    expect(mailer.sent[0]?.text).toContain("Phone: Not provided");
    expect(mailer.sent[0]?.text).toMatch(/MESSAGE\nNot provided/);
  });

  it("keeps the subject and reply-to name on a single line", async () => {
    const { service, mailer } = buildService(
      staticProductFeed([{ ...jacket, title: "Jacket\r\nBcc: someone@example.com" }]),
    );

    await service.submitEnquiry({ ...enquiry, name: "Ada\nLovelace" });

    expect(mailer.sent[0]?.subject).toBe("Product enquiry: Jacket Bcc: someone@example.com");
    expect(mailer.sent[0]?.replyTo.name).toBe("Ada Lovelace");
  });

  it("rejects an enquiry about a product that does not exist without sending email", async () => {
    const { service, mailer } = buildService();

    const submission = service.submitEnquiry({ ...enquiry, productId: "999" });

    await expect(submission).rejects.toBeInstanceOf(ValidationError);
    await expect(submission).rejects.toMatchObject({ fields: { productId: [expect.any(String)] } });
    expect(mailer.sent).toHaveLength(0);
  });

  it("still sends the enquiry when product data is unavailable, so the lead is not lost", async () => {
    const { service, mailer } = buildService({
      fetchAllProducts: () => Promise.reject(new UpstreamUnavailableError(new Error("down"))),
    });

    await expect(service.submitEnquiry(enquiry)).resolves.toEqual({ status: "received" });

    expect(mailer.sent[0]?.subject).toBe("Product enquiry: product 3");
    expect(mailer.sent[0]?.text).toContain("Product details could not be loaded");
  });

  it("propagates a mail delivery failure", async () => {
    const failure = new EmailUnavailableError(new Error("SMTP down"));
    const service = createEnquiryService({
      productSource: createInMemoryProductSource(staticProductFeed([jacket])),
      mailer: createRecordingMailer(failure),
      salesInbox,
    });

    await expect(service.submitEnquiry(enquiry)).rejects.toBe(failure);
  });
});
