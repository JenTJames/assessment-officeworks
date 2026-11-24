import { describe, expect, it } from "vitest";
import { enquiryRequestSchema, honeypotFieldName } from "./enquiry.schema.ts";

const validEnquiry = { productId: "1", name: "Ada Lovelace", email: "ada@example.com" };

describe("enquiryRequestSchema", () => {
  it("accepts the required fields only", () => {
    expect(enquiryRequestSchema.safeParse(validEnquiry).success).toBe(true);
  });

  it("accepts every optional field", () => {
    const result = enquiryRequestSchema.safeParse({
      ...validEnquiry,
      phone: "+61 (02) 9999-0000",
      message: "Is this in stock?",
      [honeypotFieldName]: "",
    });

    expect(result.success).toBe(true);
  });

  it("treats an empty phone from a blank form field as valid", () => {
    expect(enquiryRequestSchema.safeParse({ ...validEnquiry, phone: "" }).success).toBe(true);
  });

  it("trims the name", () => {
    expect(enquiryRequestSchema.parse({ ...validEnquiry, name: "  Ada  " }).name).toBe("Ada");
  });

  it.each([
    ["a blank name", { name: "   " }],
    ["an invalid email", { email: "not-an-email" }],
    ["an invalid phone", { phone: "call me" }],
    ["an invalid product id", { productId: "../1" }],
    ["an overlong message", { message: "x".repeat(2001) }],
  ])("rejects %s", (_label, override) => {
    expect(enquiryRequestSchema.safeParse({ ...validEnquiry, ...override }).success).toBe(false);
  });

  it("rejects a missing product id", () => {
    const { productId: _productId, ...withoutProductId } = validEnquiry;

    expect(enquiryRequestSchema.safeParse(withoutProductId).success).toBe(false);
  });
});
