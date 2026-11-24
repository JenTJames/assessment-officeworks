import { describe, expect, it } from "vitest";
import { toCategory, toMinorUnits, toProduct, type FakeStoreProduct } from "./fake-store-mapper.ts";

const upstreamBackpack: FakeStoreProduct = {
  id: 1,
  title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
  price: 109.95,
  description: "Your perfect pack for everyday use.",
  category: "men's clothing",
  image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
  rating: { rate: 3.9, count: 120 },
};

describe("toCategory", () => {
  it.each([
    ["men's clothing", { slug: "mens-clothing", name: "Men's clothing" }],
    ["women's clothing", { slug: "womens-clothing", name: "Women's clothing" }],
    ["jewelery", { slug: "jewellery", name: "Jewellery" }],
    ["electronics", { slug: "electronics", name: "Electronics" }],
    ["  Home & Garden ", { slug: "home-garden", name: "Home & garden" }],
  ])("maps %j", (upstreamName, expected) => {
    expect(toCategory(upstreamName)).toEqual(expected);
  });
});

describe("toMinorUnits", () => {
  it.each([
    [109.95, 10995],
    [0.1 + 0.2, 30],
    [695, 69500],
    [7.95, 795],
  ])("converts %d dollars to %d cents", (price, cents) => {
    expect(toMinorUnits(price)).toBe(cents);
  });
});

describe("toProduct", () => {
  it("maps a Fake Store product to our product shape", () => {
    expect(toProduct(upstreamBackpack)).toEqual({
      id: "1",
      title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
      description: "Your perfect pack for everyday use.",
      price: { minorUnits: 10995, currency: "USD" },
      rating: { average: 3.9, count: 120 },
      category: { slug: "mens-clothing", name: "Men's clothing" },
      imageUrl: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png",
    });
  });

  it("rejects a product whose image is not a URL", () => {
    expect(toProduct({ ...upstreamBackpack, image: "not a url" })).toBeUndefined();
  });

  it("rejects a product with an out-of-range rating", () => {
    expect(toProduct({ ...upstreamBackpack, rating: { rate: 7, count: 1 } })).toBeUndefined();
  });
});
