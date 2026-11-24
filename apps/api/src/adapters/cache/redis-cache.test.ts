import { pino } from "pino";
import { afterAll, describe, expect, it } from "vitest";
import { CacheUnavailableError } from "../../errors/cache-unavailable-error.ts";
import { createRedisCache, createRedisClient } from "./redis-cache.ts";

describe("redis cache", () => {
  const redis = createRedisClient("redis://127.0.0.1:1", pino({ level: "silent" }));
  const cache = createRedisCache(redis);

  afterAll(() => {
    redis.disconnect();
  });

  it("fails fast with CacheUnavailableError when Redis is unreachable", async () => {
    const startedAt = Date.now();

    await expect(cache.get("key")).rejects.toBeInstanceOf(CacheUnavailableError);
    await expect(cache.set("key", "value", 60)).rejects.toBeInstanceOf(CacheUnavailableError);
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});
