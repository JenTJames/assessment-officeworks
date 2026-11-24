import { rateLimit, type Store } from "express-rate-limit";
import type { RequestHandler } from "express";
import type { Logger } from "pino";
import { TooManyRequestsError } from "../errors/too-many-requests-error.ts";

export type RateLimitSettings = {
  limit: number;
  windowMs: number;
  store?: Store;
};

type RateLimiterOptions = RateLimitSettings & {
  message: string;
  logger: Logger;
};

export function createRateLimiter({
  limit,
  windowMs,
  store,
  message,
  logger,
}: RateLimiterOptions): RequestHandler {
  return rateLimit({
    limit,
    windowMs,
    store,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    logger: {
      error: (error, details) => {
        logger.error({ err: error }, details);
      },
      warn: (error, details) => {
        logger.warn({ err: error }, details);
      },
    },
    handler: (_request, _response, next) => {
      next(new TooManyRequestsError(message));
    },
  });
}
