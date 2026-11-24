import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";
import { buildProducts } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, errorResponse, server } from "@/test/server";

describe("HomePage", () => {
  it("shows the featured products and links to every category", async () => {
    server.use(http.get(apiUrl("/featured-products"), () => HttpResponse.json(buildProducts(5))));
    renderRoute("/");

    expect(screen.getByRole("heading", { level: 1, name: brand.copy.featuredTitle })).toBeVisible();
    const featured = await screen.findAllByRole("link", { name: /Product \d/ });
    expect(featured).toHaveLength(5);
    expect(featured[0]).toHaveAttribute("href", "/products/1");

    const shopByCategory = screen
      .getByRole("heading", { name: brand.copy.shopByCategoryTitle })
      .closest("section");
    if (!shopByCategory) {
      throw new Error("Shop by category section missing");
    }
    expect(within(shopByCategory).getByRole("link", { name: "Electronics" })).toHaveAttribute(
      "href",
      "/categories/electronics",
    );
  });

  it("explains an upstream outage and recovers when retried", async () => {
    let attempts = 0;
    server.use(
      http.get(apiUrl("/featured-products"), () => {
        attempts += 1;
        return attempts === 1
          ? errorResponse(503, "UPSTREAM_UNAVAILABLE", "Product data is temporarily unavailable.")
          : HttpResponse.json(buildProducts(5));
      }),
    );
    renderRoute("/");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Product data is temporarily unavailable.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findAllByRole("link", { name: /Product \d/ })).toHaveLength(5);
  });
});
