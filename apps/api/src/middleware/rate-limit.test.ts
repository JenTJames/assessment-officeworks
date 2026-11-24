import { errorResponseSchema } from "@catalogue/contracts";
import express from "express";
import type { Store } from "express-rate-limit";
import { pino } from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createErrorHandler } from "./error-handler.ts";
import { createRateLimiter, type RateLimitSettings } from "./rate-limit.ts";

const logger = pino({ level: "silent" });

function appLimitedBy(settings: RateLimitSettings) {
  const app = express();
  app.get("/", createRateLimiter({ ...settings, message: "Slow down", logger }), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(createErrorHandler(logger));
  return app;
}

describe("rate limiter", () => {
  it("rejects requests over the limit with the error envelope and message", async () => {
    const app = appLimitedBy({ limit: 1, windowMs: 60_000 });

    await request(app).get("/");
    const response = await request(app).get("/");

    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(response.body).error).toEqual({
      code: "RATE_LIMITED",
      message: "Slow down",
    });
  });

  it("lets requests through when the store is unavailable", async () => {
    const unavailableStore: Store = {
      increment: () => Promise.reject(new Error("Redis down")),
      decrement: () => Promise.resolve(),
      resetKey: () => Promise.resolve(),
    };
    const app = appLimitedBy({ limit: 1, windowMs: 60_000, store: unavailableStore });

    await request(app).get("/");
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
  });
});
