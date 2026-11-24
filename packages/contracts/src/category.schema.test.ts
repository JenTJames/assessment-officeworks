import { describe, expect, it } from "vitest";
import { categorySlugSchema } from "./category.schema.ts";

describe("categorySlugSchema", () => {
  it.each(["electronics", "mens-clothing", "jewellery"])("accepts %s", (slug) => {
    expect(categorySlugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(["men's clothing", "Mens-Clothing", "-mens", "mens--clothing", ""])(
    "rejects %j",
    (slug) => {
      expect(categorySlugSchema.safeParse(slug).success).toBe(false);
    },
  );
});
