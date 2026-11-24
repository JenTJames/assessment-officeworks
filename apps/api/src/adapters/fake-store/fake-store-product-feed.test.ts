import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import { pino } from "pino";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import { createFakeStoreProductFeed } from "./fake-store-product-feed.ts";

const baseUrl = "https://fakestore.test";
const productsUrl = `${baseUrl}/products`;

const upstreamProduct = {
  id: 9,
  title: "WD 2TB Elements Portable External Hard Drive",
  price: 64,
  description: "USB 3.0 and USB 2.0 compatibility",
  category: "electronics",
  image: "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg",
  rating: { rate: 3.3, count: 203 },
};

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

function buildFeed(timeoutMs = 1000) {
  return createFakeStoreProductFeed({ baseUrl, timeoutMs, logger: pino({ level: "silent" }) });
}

describe("Fake Store product feed", () => {
  it("fetches and maps every product", async () => {
    server.use(http.get(productsUrl, () => HttpResponse.json([upstreamProduct])));

    const products = await buildFeed().fetchAllProducts();

    expect(products).toEqual([
      expect.objectContaining({ id: "9", price: { minorUnits: 6400, currency: "USD" } }),
    ]);
  });

  it("does not send limit or sort parameters upstream", async () => {
    let requestedUrl = "";
    server.use(
      http.get(productsUrl, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    await buildFeed().fetchAllProducts();

    expect(requestedUrl).toBe(productsUrl);
  });

  it("skips products that do not match the expected shape", async () => {
    server.use(
      http.get(productsUrl, () =>
        HttpResponse.json([
          upstreamProduct,
          { id: 2, title: "No price" },
          { ...upstreamProduct, id: 3, image: "" },
        ]),
      ),
    );

    const products = await buildFeed().fetchAllProducts();

    expect(products.map((product) => product.id)).toEqual(["9"]);
  });

  it.each([
    ["an HTTP error", () => new HttpResponse(null, { status: 502 })],
    ["a network error", () => HttpResponse.error()],
    ["a non-array body", () => HttpResponse.json({ message: "maintenance" })],
    [
      "invalid JSON",
      () => new HttpResponse("<html>", { headers: { "Content-Type": "application/json" } }),
    ],
  ])("throws UpstreamUnavailableError on %s", async (_label, resolver) => {
    server.use(http.get(productsUrl, resolver));

    await expect(buildFeed().fetchAllProducts()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it("throws UpstreamUnavailableError when the request times out", async () => {
    server.use(
      http.get(productsUrl, async () => {
        await delay(200);
        return HttpResponse.json([]);
      }),
    );

    await expect(buildFeed(20).fetchAllProducts()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });
});
