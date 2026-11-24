import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";
import { catalogueConfig } from "@/config/catalogue";
import { buildCategoryPage, buildProduct, buildSearchResult, electronics } from "@/test/fixtures";
import { renderRoute } from "@/test/render";
import { apiUrl, errorResponse, server } from "@/test/server";

function sectionTitled(name: string): HTMLElement {
  const section = screen.getByRole("heading", { name }).closest("section");
  if (!section) {
    throw new Error(`Section "${name}" missing`);
  }
  return section;
}

describe("CategoryPage", () => {
  it("shows the top rated products apart from the rest of the category", async () => {
    server.use(
      http.get(apiUrl("/categories/electronics"), () => HttpResponse.json(buildCategoryPage())),
    );
    renderRoute("/categories/electronics");

    expect(await screen.findByRole("heading", { level: 1, name: "Electronics" })).toBeVisible();
    expect(screen.getByText("4 products")).toBeVisible();
    expect(within(sectionTitled(brand.copy.topRatedTitle)).getAllByRole("link")).toHaveLength(3);
    expect(
      within(sectionTitled(brand.copy.moreInCategoryTitle)).getByRole("link", {
        name: /Product 4/,
      }),
    ).toBeVisible();
  });

  it("requests the page from the URL and links to the other pages", async () => {
    let requested: URLSearchParams | undefined;
    server.use(
      http.get(apiUrl("/categories/electronics"), ({ request }) => {
        requested = new URL(request.url).searchParams;
        return HttpResponse.json(
          buildCategoryPage({
            remaining: buildSearchResult([buildProduct({ id: "9", category: electronics })], {
              page: 2,
              totalItems: 9,
              totalPages: 3,
            }),
          }),
        );
      }),
    );
    renderRoute("/categories/electronics?page=2");

    const pagination = await screen.findByRole("navigation", { name: "Pagination" });
    expect(requested?.get("page")).toBe("2");
    expect(requested?.get("pageSize")).toBe(String(catalogueConfig.categoryPageSize));
    expect(within(pagination).getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(pagination).getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/categories/electronics?page=1",
    );
    expect(within(pagination).getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/categories/electronics?page=3",
    );
  });

  it("shows a not found message for an unknown category", async () => {
    server.use(
      http.get(apiUrl("/categories/unknown"), () =>
        errorResponse(404, "NOT_FOUND", "Category not found"),
      ),
    );
    renderRoute("/categories/unknown");

    expect(await screen.findByRole("heading", { name: "Not found" })).toBeVisible();
    expect(screen.getByText("Category not found")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("does not call the API for a malformed slug", async () => {
    renderRoute("/categories/Not%20A%20Slug");

    expect(await screen.findByRole("heading", { name: "Not found" })).toBeVisible();
  });
});
