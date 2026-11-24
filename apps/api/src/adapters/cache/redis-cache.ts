import { Redis } from "ioredis";
import type { Logger } from "pino";
import { CacheUnavailableError } from "../../errors/cache-unavailable-error.ts";
import type { Cache } from "../../ports/cache.ts";

export function createRedisClient(url: string, logger: Logger): Redis {
  const redis = new Redis(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    commandTimeout: 500,
    connectTimeout: 2000,
  });
  let connected = true;
  redis.on("ready", () => {
    if (!connected) {
      logger.info("Redis connection restored");
    }
    connected = true;
  });
  redis.on("error", (error) => {
    if (connected) {
      logger.warn({ err: error }, "Redis unavailable; serving without cache until it recovers");
    }
    connected = false;
  });
  return redis;
}

async function runCommand<Result>(command: () => Promise<Result>): Promise<Result> {
  try {
    return await command();
  } catch (error) {
    if (error instanceof Error) {
      throw new CacheUnavailableError(error.message, { cause: error });
    }
    throw error;
  }
}

export function createRedisCache(redis: Redis): Cache {
  return {
    async get(key) {
      const value = await runCommand(() => redis.get(key));
      return value ?? undefined;
    },

    async set(key, value, ttlSeconds) {
      await runCommand(() => redis.set(key, value, "EX", ttlSeconds));
    },
  };
}
