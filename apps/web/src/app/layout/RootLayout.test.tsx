import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";
import { buildProduct, buildSearchResult } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, server } from "@/test/server";

describe("RootLayout", () => {
  it("links the brand name home and lists every category in the header", async () => {
    renderRoute("/missing-page");

    expect(screen.getByRole("link", { name: brand.name })).toHaveAttribute("href", "/");
    const categoryNav = screen.getByRole("navigation", { name: "Categories" });
    expect(await within(categoryNav).findByRole("link", { name: "Electronics" })).toHaveAttribute(
      "href",
      "/categories/electronics",
    );
    expect(within(categoryNav).getByRole("link", { name: "Jewellery" })).toBeVisible();
  });

  it("searches from the header and shows the matching products", async () => {
    let requestedTerm: string | null = null;
    server.use(
      http.get(apiUrl("/products"), ({ request }) => {
        requestedTerm = new URL(request.url).searchParams.get("term");
        return HttpResponse.json(buildSearchResult([buildProduct()]));
      }),
    );
    renderRoute("/missing-page");

    await userEvent.type(screen.getByRole("searchbox", { name: "Search products" }), " jacket ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("heading", { name: "Results for “jacket”" })).toBeVisible();
    expect(requestedTerm).toBe("jacket");
  });

  it("does not search for a blank term", async () => {
    renderRoute("/missing-page");

    await userEvent.type(screen.getByRole("searchbox", { name: "Search products" }), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("heading", { name: "Not found" })).toBeVisible();
  });
});
