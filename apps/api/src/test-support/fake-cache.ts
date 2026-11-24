import type { Cache } from "../ports/cache.ts";

export function createFakeCache(now: () => number): Cache {
  const entries = new Map<string, { value: string; expiresAt: number }>();
  return {
    get: (key) => {
      const entry = entries.get(key);
      return Promise.resolve(
        entry !== undefined && entry.expiresAt > now() ? entry.value : undefined,
      );
    },
    set: (key, value, ttlSeconds) => {
      entries.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
      return Promise.resolve();
    },
  };
}
