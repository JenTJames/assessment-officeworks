import type { Product, ProductId } from "@catalogue/contracts";
import { pino } from "pino";
import type { Container } from "../container.ts";
import type { FeaturedSelector } from "../ports/featured-selector.ts";
import type { ProductFeed } from "../ports/product-feed.ts";
import { createCatalogueService } from "../services/catalogue/catalogue-service.ts";
import { createInMemoryProductSource } from "../services/catalogue/in-memory-product-source.ts";
import { catalogueProducts } from "./products.ts";

export function staticProductFeed(products: readonly Product[]): ProductFeed {
  return { fetchAllProducts: () => Promise.resolve([...products]) };
}

export function staticFeaturedSelector(ids: readonly ProductId[]): FeaturedSelector {
  return { getFeaturedProductIds: () => Promise.resolve([...ids]) };
}

type TestContainerOptions = {
  feed?: ProductFeed;
  featuredIds?: readonly ProductId[];
};

export function buildTestContainer({
  feed = staticProductFeed(catalogueProducts),
  featuredIds = [],
}: TestContainerOptions = {}): Container {
  return {
    logger: pino({ level: "silent" }),
    corsOrigin: "http://localhost:5173",
    catalogueService: createCatalogueService({
      productSource: createInMemoryProductSource(feed),
      featuredSelector: staticFeaturedSelector(featuredIds),
    }),
    dispose: () => Promise.resolve(),
  };
}
