import type { Category, CategorySlug, Product } from "@catalogue/contracts";
import type { ProductFeed } from "../../ports/product-feed.ts";
import type { ProductQuery, ProductSource } from "../../ports/product-source.ts";
import { compareByRatingDescending, matchesSearchTerm, paginate } from "./product-rules.ts";

function matchesQuery(
  product: Product,
  query: ProductQuery,
  excludedIds: ReadonlySet<string>,
): boolean {
  return (
    !excludedIds.has(product.id) &&
    (query.categorySlug === undefined || product.category.slug === query.categorySlug) &&
    (query.search === undefined || matchesSearchTerm(product, query.search))
  );
}

function distinctCategories(products: readonly Product[]): Category[] {
  const categoriesBySlug = new Map<CategorySlug, Category>();
  for (const product of products) {
    categoriesBySlug.set(product.category.slug, product.category);
  }
  return [...categoriesBySlug.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function createInMemoryProductSource(feed: ProductFeed): ProductSource {
  return {
    async findProducts(query) {
      const excludedIds = new Set(query.excludeIds);
      const matching = (await feed.fetchAllProducts()).filter((product) =>
        matchesQuery(product, query, excludedIds),
      );
      if (query.sort === "rating-desc") {
        matching.sort(compareByRatingDescending);
      }
      return paginate(matching, query.page, query.pageSize);
    },

    async findProductById(id) {
      return (await feed.fetchAllProducts()).find((product) => product.id === id);
    },

    async listCategories() {
      return distinctCategories(await feed.fetchAllProducts());
    },
  };
}
