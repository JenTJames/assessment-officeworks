import type { ProductId } from "@catalogue/contracts";
import { describe, expect, it } from "vitest";
import { NotFoundError } from "../../errors/not-found-error.ts";
import { catalogueProducts } from "../../test-support/products.ts";
import { staticFeaturedSelector, staticProductFeed } from "../../test-support/test-container.ts";
import { createCatalogueService } from "./catalogue-service.ts";
import { createInMemoryProductSource } from "./in-memory-product-source.ts";

function buildService(featuredIds: readonly ProductId[] = []) {
  return createCatalogueService({
    productSource: createInMemoryProductSource(staticProductFeed(catalogueProducts)),
    featuredSelector: staticFeaturedSelector(featuredIds),
  });
}

function ids(products: readonly { id: string }[]): string[] {
  return products.map((product) => product.id);
}

describe("getFeaturedProducts", () => {
  it("falls back to the 5 highest-rated products when none are configured", async () => {
    expect(ids(await buildService().getFeaturedProducts())).toEqual(["10", "11", "3", "5", "2"]);
  });

  it("returns configured products in the configured order", async () => {
    const featured = await buildService(["7", "1", "12", "4", "9"]).getFeaturedProducts();

    expect(ids(featured)).toEqual(["7", "1", "12", "4", "9"]);
  });

  it("uses only the first 5 configured products", async () => {
    const featured = await buildService(["1", "2", "3", "4", "5", "6"]).getFeaturedProducts();

    expect(ids(featured)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("skips unknown and duplicate ids and fills the gap with top-rated products", async () => {
    const featured = await buildService(["12", "999", "12", "10"]).getFeaturedProducts();

    expect(ids(featured)).toEqual(["12", "10", "11", "3", "5"]);
  });

  it("falls back to top-rated when no configured id exists", async () => {
    expect(ids(await buildService(["998", "999"]).getFeaturedProducts())).toEqual([
      "10",
      "11",
      "3",
      "5",
      "2",
    ]);
  });
});

describe("getCategoryPage", () => {
  it("returns the top 3 by rating, then the rest paginated without repeats", async () => {
    const service = buildService();

    const firstPage = await service.getCategoryPage("electronics", { page: 1, pageSize: 2 });
    const secondPage = await service.getCategoryPage("electronics", { page: 2, pageSize: 2 });

    expect(firstPage.category).toEqual({ slug: "electronics", name: "Electronics" });
    expect(ids(firstPage.topRated)).toEqual(["10", "11", "7"]);
    expect(ids(firstPage.remaining.items)).toEqual(["8", "9"]);
    expect(ids(secondPage.remaining.items)).toEqual(["12"]);
    expect(secondPage.remaining).toMatchObject({
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    });
  });

  it("never shows a product twice across top-rated and every remaining page", async () => {
    const service = buildService();
    const pages = await Promise.all(
      [1, 2, 3].map((page) => service.getCategoryPage("electronics", { page, pageSize: 1 })),
    );

    const shown = [
      ...ids(pages[0]?.topRated ?? []),
      ...pages.flatMap((page) => ids(page.remaining.items)),
    ];

    expect(shown).toHaveLength(new Set(shown).size);
    expect(new Set(shown)).toEqual(new Set(["7", "8", "9", "10", "11", "12"]));
  });

  it("returns only top-rated products when a category has 3 or fewer", async () => {
    const page = await buildService().getCategoryPage("jewellery", { page: 1, pageSize: 4 });

    expect(ids(page.topRated)).toEqual(["5", "6"]);
    expect(page.remaining).toEqual({
      items: [],
      page: 1,
      pageSize: 4,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it("rejects an unknown category", async () => {
    await expect(
      buildService().getCategoryPage("garden", { page: 1, pageSize: 4 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("searchProducts", () => {
  it("returns paginated matches from title or description", async () => {
    const result = await buildService().searchProducts({ term: "ssd", page: 1, pageSize: 4 });

    expect(ids(result.items)).toEqual(["8", "10"]);
    expect(result.totalItems).toBe(2);
  });

  it("returns an empty page when nothing matches", async () => {
    const result = await buildService().searchProducts({ term: "zzz", page: 1, pageSize: 4 });

    expect(result).toEqual({ items: [], page: 1, pageSize: 4, totalItems: 0, totalPages: 0 });
  });
});

describe("getProduct", () => {
  it("returns the product", async () => {
    expect((await buildService().getProduct("3")).title).toBe("Mens Cotton Jacket");
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(buildService().getProduct("999")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("listCategories", () => {
  it("lists every category once", async () => {
    expect((await buildService().listCategories()).map((category) => category.slug)).toEqual([
      "electronics",
      "jewellery",
      "mens-clothing",
    ]);
  });
});
