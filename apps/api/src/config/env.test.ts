import { describe, expect, it } from "vitest";
import { InvalidEnvironmentError, loadEnv } from "./env.ts";

describe("loadEnv", () => {
  it("applies defaults and coerces the port", () => {
    const env = loadEnv({ CORS_ORIGIN: "http://localhost:5173", PORT: "4000" });

    expect(env).toEqual({
      NODE_ENV: "development",
      PORT: 4000,
      LOG_LEVEL: "info",
      CORS_ORIGIN: "http://localhost:5173",
    });
  });

  it("fails fast when a required variable is missing", () => {
    expect(() => loadEnv({})).toThrow(InvalidEnvironmentError);
  });
});
