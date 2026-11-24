import { describe, expect, it } from "vitest";
import { InvalidEnvironmentError, loadEnv } from "./env.ts";

const requiredEnv = {
  CORS_ORIGIN: "http://localhost:5173",
  SMTP_HOST: "localhost",
  MAIL_FROM: "Catalogue <no-reply@catalogue.test>",
  SALES_INBOX: "sales@catalogue.test",
};

describe("loadEnv", () => {
  it("applies defaults and coerces numbers", () => {
    const env = loadEnv({ ...requiredEnv, PORT: "4000", SMTP_PORT: "1025" });

    expect(env).toEqual({
      ...requiredEnv,
      NODE_ENV: "development",
      PORT: 4000,
      LOG_LEVEL: "info",
      REDIS_URL: undefined,
      FAKE_STORE_BASE_URL: "https://fakestoreapi.com",
      FAKE_STORE_TIMEOUT_MS: 5000,
      FEATURED_PRODUCTS_PATH: "data/featured.json",
      SMTP_PORT: 1025,
      SMTP_SECURE: false,
      SMTP_USER: undefined,
      SMTP_PASSWORD: undefined,
      SMTP_TIMEOUT_MS: 10_000,
      ENQUIRY_RATE_LIMIT_MAX: 5,
      ENQUIRY_RATE_LIMIT_WINDOW_MS: 900_000,
    });
  });

  it("treats an empty REDIS_URL as not configured", () => {
    expect(loadEnv({ ...requiredEnv, REDIS_URL: "" }).REDIS_URL).toBeUndefined();
  });

  it("accepts a redis URL", () => {
    const env = loadEnv({ ...requiredEnv, REDIS_URL: "redis://localhost:6379" });

    expect(env.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("parses SMTP_SECURE as a boolean", () => {
    expect(loadEnv({ ...requiredEnv, SMTP_SECURE: "true" }).SMTP_SECURE).toBe(true);
  });

  it("requires SMTP credentials to be set together", () => {
    expect(() => loadEnv({ ...requiredEnv, SMTP_USER: "mailer" })).toThrow(InvalidEnvironmentError);
    expect(
      loadEnv({ ...requiredEnv, SMTP_USER: "mailer", SMTP_PASSWORD: "secret" }).SMTP_USER,
    ).toBe("mailer");
  });

  it("rejects an invalid sales inbox", () => {
    expect(() => loadEnv({ ...requiredEnv, SALES_INBOX: "sales" })).toThrow(
      InvalidEnvironmentError,
    );
  });

  it("fails fast when a required variable is missing", () => {
    expect(() => loadEnv({})).toThrow(InvalidEnvironmentError);
  });
});
