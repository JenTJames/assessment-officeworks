import { describe, expect, it, vi } from "vitest";
import { catalogueProducts } from "../../test-support/products.ts";
import { staticProductFeed } from "../../test-support/test-container.ts";
import { createInMemoryProductSource } from "./in-memory-product-source.ts";

const source = createInMemoryProductSource(staticProductFeed(catalogueProducts));

function ids(products: readonly { id: string }[]): string[] {
  return products.map((product) => product.id);
}

describe("in-memory product source", () => {
  it("keeps source order when no sort is requested", async () => {
    const page = await source.findProducts({ page: 1, pageSize: 3 });

    expect(ids(page.items)).toEqual(["1", "2", "3"]);
    expect(page.totalItems).toBe(catalogueProducts.length);
  });

  it("filters by search term across title and description", async () => {
    const page = await source.findProducts({ search: "backpack", page: 1, pageSize: 10 });

    expect(ids(page.items)).toEqual(["1", "7"]);
  });

  it("filters by category and sorts by rating", async () => {
    const page = await source.findProducts({
      categorySlug: "mens-clothing",
      sort: "rating-desc",
      page: 1,
      pageSize: 10,
    });

    expect(ids(page.items)).toEqual(["3", "2", "1", "4"]);
  });

  it("excludes the given ids before paginating", async () => {
    const page = await source.findProducts({
      categorySlug: "mens-clothing",
      sort: "rating-desc",
      excludeIds: ["3", "2"],
      page: 1,
      pageSize: 10,
    });

    expect(ids(page.items)).toEqual(["1", "4"]);
    expect(page.totalItems).toBe(2);
  });

  it("finds a product by id", async () => {
    expect((await source.findProductById("5"))?.title).toBe("Dragon Bracelet");
    expect(await source.findProductById("999")).toBeUndefined();
  });

  it("lists distinct categories sorted by name", async () => {
    expect(ids((await source.listCategories()).map((category) => ({ id: category.slug })))).toEqual(
      ["electronics", "jewellery", "mens-clothing"],
    );
  });

  it("does not mutate the feed's products when sorting", async () => {
    const products = [...catalogueProducts];
    const fetchAllProducts = vi.fn(() => Promise.resolve(products));
    await createInMemoryProductSource({ fetchAllProducts }).findProducts({
      sort: "rating-desc",
      page: 1,
      pageSize: 1,
    });

    expect(ids(products)).toEqual(ids(catalogueProducts));
  });
});
