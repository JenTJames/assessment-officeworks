import type { Category, CategoryPage, Product, SearchResult } from "@catalogue/contracts";

export const electronics: Category = { slug: "electronics", name: "Electronics" };
export const jewellery: Category = { slug: "jewellery", name: "Jewellery" };

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    title: "Mens Cotton Jacket",
    description: "Great outerwear jacket for spring and autumn.",
    price: { minorUnits: 5599, currency: "USD" },
    rating: { average: 4.7, count: 500 },
    category: { slug: "mens-clothing", name: "Men's Clothing" },
    imageUrl: "https://example.com/jacket.png",
    ...overrides,
  };
}

export function buildProducts(count: number, overrides: Partial<Product> = {}): Product[] {
  return Array.from({ length: count }, (_, index) =>
    buildProduct({ id: String(index + 1), title: `Product ${String(index + 1)}`, ...overrides }),
  );
}

export function buildSearchResult(
  items: Product[],
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    items,
    page: 1,
    pageSize: 12,
    totalItems: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    ...overrides,
  };
}

export function buildCategoryPage(overrides: Partial<CategoryPage> = {}): CategoryPage {
  return {
    category: electronics,
    topRated: buildProducts(3, { category: electronics }),
    remaining: buildSearchResult([
      buildProduct({ id: "4", title: "Product 4", category: electronics }),
    ]),
    ...overrides,
  };
}
