import { describe, expect, it } from "vitest";
import { InvalidEnvironmentError, loadEnv } from "./env.ts";

describe("loadEnv", () => {
  it("applies defaults and coerces numbers", () => {
    const env = loadEnv({ CORS_ORIGIN: "http://localhost:5173", PORT: "4000" });

    expect(env).toEqual({
      NODE_ENV: "development",
      PORT: 4000,
      LOG_LEVEL: "info",
      CORS_ORIGIN: "http://localhost:5173",
      REDIS_URL: undefined,
      FAKE_STORE_BASE_URL: "https://fakestoreapi.com",
      FAKE_STORE_TIMEOUT_MS: 5000,
      FEATURED_PRODUCTS_PATH: "data/featured.json",
    });
  });

  it("treats an empty REDIS_URL as not configured", () => {
    expect(
      loadEnv({ CORS_ORIGIN: "http://localhost:5173", REDIS_URL: "" }).REDIS_URL,
    ).toBeUndefined();
  });

  it("accepts a redis URL", () => {
    const env = loadEnv({
      CORS_ORIGIN: "http://localhost:5173",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("fails fast when a required variable is missing", () => {
    expect(() => loadEnv({})).toThrow(InvalidEnvironmentError);
  });
});
