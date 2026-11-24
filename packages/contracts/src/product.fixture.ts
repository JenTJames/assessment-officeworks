import type { Product } from "./product.schema.ts";

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    title: "Foldsack No. 1 Backpack",
    description: "Fits 15 inch laptops.",
    price: { minorUnits: 10995, currency: "USD" },
    rating: { average: 3.9, count: 120 },
    category: { slug: "mens-clothing", name: "Men's clothing" },
    imageUrl: "https://example.com/backpack.png",
    ...overrides,
  };
}
