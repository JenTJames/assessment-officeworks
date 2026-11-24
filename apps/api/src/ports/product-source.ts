import type { Category, CategorySlug, Page, Product, ProductId } from "@catalogue/contracts";

export type ProductSortOrder = "rating-desc";

export type ProductQuery = {
  search?: string;
  categorySlug?: CategorySlug;
  excludeIds?: readonly ProductId[];
  sort?: ProductSortOrder;
  page: number;
  pageSize: number;
};

export interface ProductSource {
  findProducts(query: ProductQuery): Promise<Page<Product>>;
  findProductById(id: ProductId): Promise<Product | undefined>;
  listCategories(): Promise<Category[]>;
}
