import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildProduct } from "@/test/fixtures";
import { renderWithRouter } from "@/test/render";
import { ProductTile } from "./ProductTile";

describe("ProductTile", () => {
  it("links to the product and shows its category, price and rating", () => {
    renderWithRouter(<ProductTile product={buildProduct({ id: "7" })} />);

    const link = screen.getByRole("link", { name: /Mens Cotton Jacket/ });
    expect(link).toHaveAttribute("href", "/products/7");
    expect(link).toHaveTextContent("Men's Clothing");
    expect(link).toHaveTextContent("$55.99");
    expect(link).toHaveTextContent("Rated 4.7 out of 5 from 500 ratings");
  });
});
