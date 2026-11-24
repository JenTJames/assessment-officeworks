import type { Product } from "@catalogue/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeCache } from "../../test-support/fake-cache.ts";
import { CacheUnavailableError } from "../../errors/cache-unavailable-error.ts";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import type { Cache } from "../../ports/cache.ts";
import { buildProduct } from "../../test-support/products.ts";
import { createCachedProductFeed, productCachePolicy } from "./cached-product-feed.ts";

const minute = 60 * 1000;
const hour = 60 * minute;

const firstCatalogue = [buildProduct({ id: "1" })];
const secondCatalogue = [buildProduct({ id: "2" })];

const unavailableCache: Cache = {
  get: () => Promise.reject(new CacheUnavailableError("down")),
  set: () => Promise.reject(new CacheUnavailableError("down")),
};

function upstreamFailure() {
  return Promise.reject(new UpstreamUnavailableError(new Error("Fake Store down")));
}

describe("cached product feed", () => {
  let currentTime: number;
  const now = () => currentTime;
  const fetchAllProducts = vi.fn<() => Promise<Product[]>>();

  beforeEach(() => {
    currentTime = 1_000_000;
    fetchAllProducts.mockReset();
  });

  function buildFeed(cache: Cache = createFakeCache(now)) {
    return createCachedProductFeed({ feed: { fetchAllProducts }, cache, now });
  }

  it("fetches upstream on a cold cache", async () => {
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue);

    expect(await buildFeed().fetchAllProducts()).toEqual(firstCatalogue);
    expect(fetchAllProducts).toHaveBeenCalledTimes(1);
  });

  it("serves from cache while the data is under 10 minutes old", async () => {
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue);
    const feed = buildFeed();
    await feed.fetchAllProducts();

    currentTime += productCachePolicy.freshForMs - 1;

    expect(await feed.fetchAllProducts()).toEqual(firstCatalogue);
    expect(fetchAllProducts).toHaveBeenCalledTimes(1);
  });

  it("refetches once the data is 10 minutes old", async () => {
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue).mockResolvedValueOnce(secondCatalogue);
    const feed = buildFeed();
    await feed.fetchAllProducts();

    currentTime += 10 * minute;

    expect(await feed.fetchAllProducts()).toEqual(secondCatalogue);
    expect(fetchAllProducts).toHaveBeenCalledTimes(2);
  });

  it("serves the last good copy when a refetch fails within 24 hours", async () => {
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue).mockImplementationOnce(upstreamFailure);
    const feed = buildFeed();
    await feed.fetchAllProducts();

    currentTime += 23 * hour;

    expect(await feed.fetchAllProducts()).toEqual(firstCatalogue);
  });

  it("keeps retrying upstream on each request while serving stale data", async () => {
    fetchAllProducts
      .mockResolvedValueOnce(firstCatalogue)
      .mockImplementationOnce(upstreamFailure)
      .mockResolvedValueOnce(secondCatalogue);
    const feed = buildFeed();
    await feed.fetchAllProducts();
    currentTime += hour;
    await feed.fetchAllProducts();

    expect(await feed.fetchAllProducts()).toEqual(secondCatalogue);
  });

  it("fails once the last good copy is 24 hours old", async () => {
    const cache = createFakeCache(() => 0);
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue).mockImplementationOnce(upstreamFailure);
    const feed = buildFeed(cache);
    await feed.fetchAllProducts();

    currentTime += 24 * hour;

    await expect(feed.fetchAllProducts()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it("fails when upstream is down and nothing is cached", async () => {
    fetchAllProducts.mockImplementationOnce(upstreamFailure);

    await expect(buildFeed().fetchAllProducts()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it("calls upstream directly when the cache is unavailable", async () => {
    fetchAllProducts.mockResolvedValue(firstCatalogue);
    const feed = buildFeed(unavailableCache);

    expect(await feed.fetchAllProducts()).toEqual(firstCatalogue);
    expect(await feed.fetchAllProducts()).toEqual(firstCatalogue);
    expect(fetchAllProducts).toHaveBeenCalledTimes(2);
  });

  it("ignores a corrupt cache entry", async () => {
    const cache = createFakeCache(now);
    await cache.set(productCachePolicy.key, "{not json", 60);
    fetchAllProducts.mockResolvedValueOnce(firstCatalogue);

    expect(await buildFeed(cache).fetchAllProducts()).toEqual(firstCatalogue);
  });

  it("shares one upstream request between concurrent callers", async () => {
    fetchAllProducts.mockResolvedValue(firstCatalogue);
    const feed = buildFeed();

    await Promise.all([feed.fetchAllProducts(), feed.fetchAllProducts(), feed.fetchAllProducts()]);

    expect(fetchAllProducts).toHaveBeenCalledTimes(1);
  });

  it("does not hide unexpected errors behind stale data", async () => {
    fetchAllProducts
      .mockResolvedValueOnce(firstCatalogue)
      .mockRejectedValueOnce(new TypeError("bug"));
    const feed = buildFeed();
    await feed.fetchAllProducts();
    currentTime += hour;

    await expect(feed.fetchAllProducts()).rejects.toBeInstanceOf(TypeError);
  });
});
