import { resolve } from "node:path";
import type { Store } from "express-rate-limit";
import { pino, type Logger } from "pino";
import { createMemoryCache } from "./adapters/cache/memory-cache.ts";
import { createRedisCache, createRedisClient } from "./adapters/cache/redis-cache.ts";
import { createSmtpMailer, createSmtpTransport } from "./adapters/email/smtp-mailer.ts";
import { createFakeStoreProductFeed } from "./adapters/fake-store/fake-store-product-feed.ts";
import { createJsonFileFeaturedSelector } from "./adapters/featured/json-file-featured-selector.ts";
import { createRedisRateLimitStore } from "./adapters/rate-limit/redis-rate-limit-store.ts";
import type { Env } from "./config/env.ts";
import type { RateLimitSettings } from "./middleware/rate-limit.ts";
import type { Cache } from "./ports/cache.ts";
import { createCachedProductFeed } from "./services/catalogue/cached-product-feed.ts";
import {
  createCatalogueService,
  type CatalogueService,
} from "./services/catalogue/catalogue-service.ts";
import { createInMemoryProductSource } from "./services/catalogue/in-memory-product-source.ts";
import { createEnquiryService, type EnquiryService } from "./services/enquiry/enquiry-service.ts";

export type Container = {
  logger: Logger;
  corsOrigin: string;
  catalogueService: CatalogueService;
  enquiryService: EnquiryService;
  enquiryRateLimit: RateLimitSettings;
  dispose: () => Promise<void>;
};

type SharedStores = {
  cache: Cache;
  enquiryRateLimitStore: Store | undefined;
  dispose: () => Promise<void>;
};

function createLogger(env: Env): Logger {
  const prettyTransport =
    env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : {};
  return pino({ level: env.LOG_LEVEL, ...prettyTransport });
}

function createSharedStores(env: Env, logger: Logger): SharedStores {
  if (env.REDIS_URL === undefined) {
    logger.info("REDIS_URL not set; using in-process cache and rate limit stores");
    return {
      cache: createMemoryCache(),
      enquiryRateLimitStore: undefined,
      dispose: () => Promise.resolve(),
    };
  }
  const redis = createRedisClient(env.REDIS_URL, logger);
  return {
    cache: createRedisCache(redis),
    enquiryRateLimitStore: createRedisRateLimitStore(redis, "rate-limit:enquiries:"),
    dispose: async () => {
      await redis.quit().catch(() => {
        redis.disconnect();
      });
    },
  };
}

export function createContainer(env: Env): Container {
  const logger = createLogger(env);
  const stores = createSharedStores(env, logger);

  const fakeStoreFeed = createFakeStoreProductFeed({
    baseUrl: env.FAKE_STORE_BASE_URL,
    timeoutMs: env.FAKE_STORE_TIMEOUT_MS,
    logger,
  });
  const productFeed = createCachedProductFeed({
    feed: fakeStoreFeed,
    cache: stores.cache,
    now: Date.now,
  });
  const productSource = createInMemoryProductSource(productFeed);
  const featuredSelector = createJsonFileFeaturedSelector({
    filePath: resolve(env.FEATURED_PRODUCTS_PATH),
    logger,
  });
  const mailTransport = createSmtpTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    timeoutMs: env.SMTP_TIMEOUT_MS,
  });

  return {
    logger,
    corsOrigin: env.CORS_ORIGIN,
    catalogueService: createCatalogueService({ productSource, featuredSelector }),
    enquiryService: createEnquiryService({
      productSource,
      mailer: createSmtpMailer({ transport: mailTransport, from: env.MAIL_FROM }),
      salesInbox: env.SALES_INBOX,
    }),
    enquiryRateLimit: {
      limit: env.ENQUIRY_RATE_LIMIT_MAX,
      windowMs: env.ENQUIRY_RATE_LIMIT_WINDOW_MS,
      store: stores.enquiryRateLimitStore,
    },
    dispose: async () => {
      mailTransport.close();
      await stores.dispose();
    },
  };
}
