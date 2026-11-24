import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { buildProducts, buildSearchResult } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, server } from "@/test/server";

describe("SearchPage", () => {
  it("shows the products matching the term in the URL", async () => {
    server.use(
      http.get(apiUrl("/products"), () => HttpResponse.json(buildSearchResult(buildProducts(2)))),
    );
    renderRoute("/search?q=jacket");

    expect(await screen.findByRole("heading", { name: "Results for “jacket”" })).toBeVisible();
    expect(screen.getByText("2 products match in title or description")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Product \d/ })).toHaveLength(2);
  });

  it("tells the customer when nothing matches", async () => {
    server.use(http.get(apiUrl("/products"), () => HttpResponse.json(buildSearchResult([]))));
    renderRoute("/search?q=zzz");

    expect(await screen.findByRole("heading", { name: "No products found" })).toBeVisible();
  });

  it("prompts for a term instead of searching when none is given", () => {
    renderRoute("/search");

    expect(screen.getByRole("heading", { name: "Search the catalogue" })).toBeVisible();
  });
});
