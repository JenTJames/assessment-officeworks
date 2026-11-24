import type { Cache } from "../../ports/cache.ts";

type MemoryCacheEntry = {
  value: string;
  expiresAt: number;
};

export function createMemoryCache(now: () => number = Date.now): Cache {
  const entries = new Map<string, MemoryCacheEntry>();

  return {
    get(key) {
      const entry = entries.get(key);
      if (entry === undefined || entry.expiresAt <= now()) {
        entries.delete(key);
        return Promise.resolve(undefined);
      }
      return Promise.resolve(entry.value);
    },

    set(key, value, ttlSeconds) {
      entries.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
      return Promise.resolve();
    },
  };
}
