import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { buildProduct } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, errorResponse, server } from "@/test/server";

describe("ProductPage", () => {
  it("shows the product details with a link back to its category", async () => {
    server.use(http.get(apiUrl("/products/1"), () => HttpResponse.json(buildProduct())));
    renderRoute("/products/1");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mens Cotton Jacket" }),
    ).toBeVisible();
    expect(screen.getByText("$55.99")).toBeVisible();
    expect(screen.getByText("Rated 4.7 out of 5 from 500 ratings")).toBeInTheDocument();
    expect(screen.getByText("Great outerwear jacket for spring and autumn.")).toBeVisible();
    expect(screen.getByRole("img", { name: "Mens Cotton Jacket" })).toHaveAttribute(
      "src",
      "https://example.com/jacket.png",
    );
    const categoryLinks = screen.getAllByRole("link", { name: "Men's Clothing" });
    expect(
      categoryLinks.every((link) => link.getAttribute("href") === "/categories/mens-clothing"),
    ).toBe(true);
  });

  it("shows a not found message for an unknown product", async () => {
    server.use(
      http.get(apiUrl("/products/404"), () => errorResponse(404, "NOT_FOUND", "Product not found")),
    );
    renderRoute("/products/404");

    expect(await screen.findByRole("heading", { name: "Not found" })).toBeVisible();
    expect(screen.getByText("Product not found")).toBeVisible();
  });

  it("treats a response that breaks the contract as an error", async () => {
    server.use(http.get(apiUrl("/products/1"), () => HttpResponse.json({ id: "1" })));
    renderRoute("/products/1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
