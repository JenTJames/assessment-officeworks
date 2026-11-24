import { describe, expect, it } from "vitest";
import { createMemoryCache } from "./memory-cache.ts";

describe("memory cache", () => {
  it("returns a stored value until its ttl elapses", async () => {
    let currentTime = 0;
    const cache = createMemoryCache(() => currentTime);
    await cache.set("key", "value", 10);

    currentTime = 9_999;
    expect(await cache.get("key")).toBe("value");

    currentTime = 10_000;
    expect(await cache.get("key")).toBeUndefined();
  });

  it("returns undefined for a missing key", async () => {
    expect(await createMemoryCache().get("missing")).toBeUndefined();
  });
});
