import type { CategorySlug, ProductId } from "@catalogue/contracts";

export const searchTermParam = "q";
export const pageParam = "page";

export const routePatterns = {
  home: "/",
  category: "/categories/:slug",
  search: "/search",
  product: "/products/:id",
} as const;

export const paths = {
  home: () => routePatterns.home,
  category: (slug: CategorySlug) => `/categories/${encodeURIComponent(slug)}`,
  product: (id: ProductId) => `/products/${encodeURIComponent(id)}`,
  search: (term: string) =>
    `${routePatterns.search}?${new URLSearchParams({ [searchTermParam]: term }).toString()}`,
};

export function withPage(searchParams: URLSearchParams, page: number): string {
  const next = new URLSearchParams(searchParams);
  next.set(pageParam, String(page));
  return `?${next.toString()}`;
}
