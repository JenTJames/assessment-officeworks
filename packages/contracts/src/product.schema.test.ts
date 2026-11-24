import { describe, expect, it } from "vitest";
import { buildProduct } from "./product.fixture.ts";
import { productIdSchema, productSchema } from "./product.schema.ts";

describe("productSchema", () => {
  it("accepts a valid product", () => {
    expect(productSchema.safeParse(buildProduct()).success).toBe(true);
  });

  it("rejects a fractional price in minor units", () => {
    const product = buildProduct({ price: { minorUnits: 109.95, currency: "USD" } });

    expect(productSchema.safeParse(product).success).toBe(false);
  });

  it.each([-0.1, 5.1])("rejects a rating average of %s", (average) => {
    const product = buildProduct({ rating: { average, count: 1 } });

    expect(productSchema.safeParse(product).success).toBe(false);
  });

  it("rejects a non-http image URL", () => {
    const product = buildProduct({ imageUrl: "javascript:alert(1)" });

    expect(productSchema.safeParse(product).success).toBe(false);
  });
});

describe("productIdSchema", () => {
  it.each(["1", "SKU-42_a"])("accepts %s", (id) => {
    expect(productIdSchema.safeParse(id).success).toBe(true);
  });

  it.each(["", "../etc", "a b", "x".repeat(65)])("rejects %j", (id) => {
    expect(productIdSchema.safeParse(id).success).toBe(false);
  });
});
