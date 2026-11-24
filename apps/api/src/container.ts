import { resolve } from "node:path";
import { pino, type Logger } from "pino";
import { createMemoryCache } from "./adapters/cache/memory-cache.ts";
import { createRedisCache, createRedisClient } from "./adapters/cache/redis-cache.ts";
import { createFakeStoreProductFeed } from "./adapters/fake-store/fake-store-product-feed.ts";
import { createJsonFileFeaturedSelector } from "./adapters/featured/json-file-featured-selector.ts";
import type { Env } from "./config/env.ts";
import type { Cache } from "./ports/cache.ts";
import { createCachedProductFeed } from "./services/catalogue/cached-product-feed.ts";
import {
  createCatalogueService,
  type CatalogueService,
} from "./services/catalogue/catalogue-service.ts";
import { createInMemoryProductSource } from "./services/catalogue/in-memory-product-source.ts";

export type Container = {
  logger: Logger;
  corsOrigin: string;
  catalogueService: CatalogueService;
  dispose: () => Promise<void>;
};

type CacheWithLifecycle = {
  cache: Cache;
  dispose: () => Promise<void>;
};

function createLogger(env: Env): Logger {
  const prettyTransport =
    env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : {};
  return pino({ level: env.LOG_LEVEL, ...prettyTransport });
}

function createCache(env: Env, logger: Logger): CacheWithLifecycle {
  if (env.REDIS_URL === undefined) {
    logger.info("REDIS_URL not set; using in-process memory cache");
    return { cache: createMemoryCache(), dispose: () => Promise.resolve() };
  }
  const redis = createRedisClient(env.REDIS_URL, logger);
  return {
    cache: createRedisCache(redis),
    dispose: async () => {
      await redis.quit().catch(() => {
        redis.disconnect();
      });
    },
  };
}

export function createContainer(env: Env): Container {
  const logger = createLogger(env);
  const { cache, dispose } = createCache(env, logger);

  const fakeStoreFeed = createFakeStoreProductFeed({
    baseUrl: env.FAKE_STORE_BASE_URL,
    timeoutMs: env.FAKE_STORE_TIMEOUT_MS,
    logger,
  });
  const productFeed = createCachedProductFeed({ feed: fakeStoreFeed, cache, now: Date.now });
  const productSource = createInMemoryProductSource(productFeed);
  const featuredSelector = createJsonFileFeaturedSelector({
    filePath: resolve(env.FEATURED_PRODUCTS_PATH),
    logger,
  });

  return {
    logger,
    corsOrigin: env.CORS_ORIGIN,
    catalogueService: createCatalogueService({ productSource, featuredSelector }),
    dispose,
  };
}
