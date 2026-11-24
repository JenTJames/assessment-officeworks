import type { Product } from "@catalogue/contracts";

export interface ProductFeed {
  fetchAllProducts(): Promise<Product[]>;
}
