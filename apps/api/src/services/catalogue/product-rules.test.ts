import { describe, expect, it } from "vitest";
import { buildProduct } from "../../test-support/products.ts";
import { compareByRatingDescending, matchesSearchTerm, paginate } from "./product-rules.ts";

describe("matchesSearchTerm", () => {
  const product = buildProduct({
    id: "1",
    title: "Fjallraven Backpack",
    description: "Fits 15 inch Laptops",
  });

  it.each(["backpack", "BACKPACK", "jallr", "laptops", "15 inch"])(
    "matches %j case-insensitively in title or description",
    (term) => {
      expect(matchesSearchTerm(product, term)).toBe(true);
    },
  );

  it("does not match a term that appears in neither field", () => {
    expect(matchesSearchTerm(product, "monitor")).toBe(false);
  });

  it("treats regular expression characters literally", () => {
    expect(matchesSearchTerm(product, ".*")).toBe(false);
  });
});

describe("compareByRatingDescending", () => {
  it("orders by average, then review count, then id", () => {
    const products = [
      buildProduct({ id: "10", rating: [4, 5] }),
      buildProduct({ id: "2", rating: [4, 5] }),
      buildProduct({ id: "3", rating: [4.5, 1] }),
      buildProduct({ id: "4", rating: [4, 50] }),
    ];

    expect(products.sort(compareByRatingDescending).map((product) => product.id)).toEqual([
      "3",
      "4",
      "2",
      "10",
    ]);
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("returns the requested page with totals", () => {
    expect(paginate(items, 2, 2)).toEqual({
      items: [3, 4],
      page: 2,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
    });
  });

  it("returns a partial last page", () => {
    expect(paginate(items, 3, 2).items).toEqual([5]);
  });

  it("returns no items beyond the last page", () => {
    expect(paginate(items, 4, 2)).toMatchObject({ items: [], totalPages: 3 });
  });

  it("reports zero pages for no items", () => {
    expect(paginate([], 1, 4)).toEqual({
      items: [],
      page: 1,
      pageSize: 4,
      totalItems: 0,
      totalPages: 0,
    });
  });
});
