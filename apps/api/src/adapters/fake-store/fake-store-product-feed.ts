import type { Product } from "@catalogue/contracts";
import type { Logger } from "pino";
import { z } from "zod";
import { UpstreamUnavailableError } from "../../errors/upstream-unavailable-error.ts";
import type { ProductFeed } from "../../ports/product-feed.ts";
import { fakeStoreProductSchema, toProduct } from "./fake-store-mapper.ts";

type FakeStoreProductFeedOptions = {
  baseUrl: string;
  timeoutMs: number;
  logger: Logger;
};

const productListPayloadSchema = z.array(z.json());

async function requestProductsPayload(url: URL, timeoutMs: number) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Fake Store responded with HTTP ${String(response.status)}`);
    }
    return productListPayloadSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof Error) {
      throw new UpstreamUnavailableError(error);
    }
    throw error;
  }
}

export function createFakeStoreProductFeed({
  baseUrl,
  timeoutMs,
  logger,
}: FakeStoreProductFeedOptions): ProductFeed {
  const productsUrl = new URL("/products", baseUrl);

  return {
    async fetchAllProducts() {
      const payload = await requestProductsPayload(productsUrl, timeoutMs);
      const products: Product[] = [];
      for (const item of payload) {
        const upstream = fakeStoreProductSchema.safeParse(item);
        const product = upstream.success ? toProduct(upstream.data) : undefined;
        if (product === undefined) {
          logger.warn(
            { item },
            "Skipping Fake Store product that does not match the expected shape",
          );
          continue;
        }
        products.push(product);
      }
      return products;
    },
  };
}
