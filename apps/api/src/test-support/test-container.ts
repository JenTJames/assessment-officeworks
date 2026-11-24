import type { Product, ProductId } from "@catalogue/contracts";
import { pino } from "pino";
import type { Container } from "../container.ts";
import type { RateLimitSettings } from "../middleware/rate-limit.ts";
import type { FeaturedSelector } from "../ports/featured-selector.ts";
import type { Mailer } from "../ports/mailer.ts";
import type { ProductFeed } from "../ports/product-feed.ts";
import { createCatalogueService } from "../services/catalogue/catalogue-service.ts";
import { createInMemoryProductSource } from "../services/catalogue/in-memory-product-source.ts";
import { createEnquiryService } from "../services/enquiry/enquiry-service.ts";
import { catalogueProducts } from "./products.ts";
import { createRecordingMailer } from "./recording-mailer.ts";

export const testSalesInbox = "sales@catalogue.test";

export function staticProductFeed(products: readonly Product[]): ProductFeed {
  return { fetchAllProducts: () => Promise.resolve([...products]) };
}

export function staticFeaturedSelector(ids: readonly ProductId[]): FeaturedSelector {
  return { getFeaturedProductIds: () => Promise.resolve([...ids]) };
}

type TestContainerOptions = {
  feed?: ProductFeed;
  featuredIds?: readonly ProductId[];
  mailer?: Mailer;
  enquiryRateLimit?: RateLimitSettings;
  trustProxyHops?: number;
};

export function buildTestContainer({
  feed = staticProductFeed(catalogueProducts),
  featuredIds = [],
  mailer = createRecordingMailer(),
  enquiryRateLimit = { limit: 100, windowMs: 60_000 },
  trustProxyHops = 0,
}: TestContainerOptions = {}): Container {
  const productSource = createInMemoryProductSource(feed);
  return {
    logger: pino({ level: "silent" }),
    corsOrigin: "http://localhost:5173",
    trustProxyHops,
    catalogueService: createCatalogueService({
      productSource,
      featuredSelector: staticFeaturedSelector(featuredIds),
    }),
    enquiryService: createEnquiryService({ productSource, mailer, salesInbox: testSalesInbox }),
    enquiryRateLimit,
    dispose: () => Promise.resolve(),
  };
}
