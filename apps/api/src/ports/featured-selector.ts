import type { ProductId } from "@catalogue/contracts";

export interface FeaturedSelector {
  getFeaturedProductIds(): Promise<ProductId[]>;
}
