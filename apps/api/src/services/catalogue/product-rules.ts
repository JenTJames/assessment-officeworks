import type { Page, Product } from "@catalogue/contracts";

export function matchesSearchTerm(product: Product, term: string): boolean {
  const needle = term.toLowerCase();
  return (
    product.title.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle)
  );
}

export function compareByRatingDescending(first: Product, second: Product): number {
  return (
    second.rating.average - first.rating.average ||
    second.rating.count - first.rating.count ||
    first.id.localeCompare(second.id, "en", { numeric: true })
  );
}

export function paginate<Item>(items: readonly Item[], page: number, pageSize: number): Page<Item> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}
