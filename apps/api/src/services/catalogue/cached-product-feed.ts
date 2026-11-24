import { productListSchema, type Product } from "@catalogue/contracts";
import { z } from "zod";
import { CacheUnavailableError } from "../../errors/cache-unavailable-error.ts";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import type { Cache } from "../../ports/cache.ts";
import type { ProductFeed } from "../../ports/product-feed.ts";

const minuteInMs = 60 * 1000;

export const productCachePolicy = {
  key: "catalogue:products:v1",
  freshForMs: 10 * minuteInMs,
  serveStaleForMs: 24 * 60 * minuteInMs,
} as const;

const cacheEntrySchema = z.object({
  fetchedAt: z.number(),
  products: productListSchema,
});

type CacheEntry = z.infer<typeof cacheEntrySchema>;

type CachedProductFeedDependencies = {
  feed: ProductFeed;
  cache: Cache;
  now: () => number;
};

export function createCachedProductFeed({
  feed,
  cache,
  now,
}: CachedProductFeedDependencies): ProductFeed {
  let inFlightLoad: Promise<Product[]> | undefined;

  function ageOf(entry: CacheEntry): number {
    return now() - entry.fetchedAt;
  }

  async function readEntry(): Promise<CacheEntry | undefined> {
    try {
      const serialized = await cache.get(productCachePolicy.key);
      if (serialized === undefined) {
        return undefined;
      }
      const parsed = cacheEntrySchema.safeParse(JSON.parse(serialized));
      return parsed.success ? parsed.data : undefined;
    } catch (error) {
      if (error instanceof CacheUnavailableError || error instanceof SyntaxError) {
        return undefined;
      }
      throw error;
    }
  }

  async function writeEntry(entry: CacheEntry): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(productCachePolicy.serveStaleForMs / 1000);
      await cache.set(productCachePolicy.key, JSON.stringify(entry), ttlSeconds);
    } catch (error) {
      if (error instanceof CacheUnavailableError) {
        return;
      }
      throw error;
    }
  }

  async function refetch(lastGoodEntry: CacheEntry | undefined): Promise<Product[]> {
    try {
      const products = await feed.fetchAllProducts();
      await writeEntry({ fetchedAt: now(), products });
      return products;
    } catch (error) {
      const canServeStale =
        lastGoodEntry !== undefined && ageOf(lastGoodEntry) < productCachePolicy.serveStaleForMs;
      if (error instanceof UpstreamUnavailableError && canServeStale) {
        return lastGoodEntry.products;
      }
      throw error;
    }
  }

  async function load(): Promise<Product[]> {
    const entry = await readEntry();
    if (entry !== undefined && ageOf(entry) < productCachePolicy.freshForMs) {
      return entry.products;
    }
    return refetch(entry);
  }

  return {
    fetchAllProducts() {
      inFlightLoad ??= load().finally(() => {
        inFlightLoad = undefined;
      });
      return inFlightLoad;
    },
  };
}
