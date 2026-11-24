import type { Store } from "express-rate-limit";
import type { Redis } from "ioredis";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { z } from "zod";

const redisValueSchema = z.union([z.boolean(), z.number(), z.string()]);
const redisReplySchema = z.union([redisValueSchema, z.array(redisValueSchema)]);

export function createRedisRateLimitStore(redis: Redis, prefix: string): Store {
  return new RedisStore({
    prefix,
    sendCommand: async (command, ...args): Promise<RedisReply> =>
      redisReplySchema.parse(await redis.call(command, ...args)),
  });
}
