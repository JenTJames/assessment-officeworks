import { describe, expect, it } from "vitest";
import { formatCount, formatPrice, formatRatingAverage } from "./format";

describe("formatPrice", () => {
  it("formats minor units as dollars and cents", () => {
    expect(formatPrice({ minorUnits: 5599, currency: "USD" })).toBe("$55.99");
    expect(formatPrice({ minorUnits: 100000, currency: "USD" })).toBe("$1,000.00");
  });
});

describe("formatRatingAverage", () => {
  it("always shows one decimal place", () => {
    expect(formatRatingAverage({ average: 4, count: 1 })).toBe("4.0");
  });
});

describe("formatCount", () => {
  it("uses the singular for one and the plural otherwise", () => {
    expect(formatCount(1, "product")).toBe("1 product");
    expect(formatCount(1200, "product")).toBe("1,200 products");
  });
});
