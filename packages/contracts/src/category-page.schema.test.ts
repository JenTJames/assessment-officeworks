import { describe, expect, it } from "vitest";
import { categoryPageSchema } from "./category-page.schema.ts";
import { buildProduct } from "./product.fixture.ts";

const category = { slug: "electronics", name: "Electronics" };

function remainingPage(ids: string[]) {
  return {
    page: 1,
    pageSize: 4,
    totalItems: ids.length,
    totalPages: ids.length === 0 ? 0 : 1,
    items: ids.map((id) => buildProduct({ id })),
  };
}

describe("categoryPageSchema", () => {
  it("accepts up to three top-rated products followed by distinct remaining products", () => {
    const result = categoryPageSchema.safeParse({
      category,
      topRated: ["1", "2", "3"].map((id) => buildProduct({ id })),
      remaining: remainingPage(["4", "5"]),
    });

    expect(result.success).toBe(true);
  });

  it("rejects more than three top-rated products", () => {
    const result = categoryPageSchema.safeParse({
      category,
      topRated: ["1", "2", "3", "4"].map((id) => buildProduct({ id })),
      remaining: remainingPage([]),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a product that appears in both sections", () => {
    const result = categoryPageSchema.safeParse({
      category,
      topRated: [buildProduct({ id: "1" })],
      remaining: remainingPage(["1", "2"]),
    });

    expect(result.success).toBe(false);
  });
});
