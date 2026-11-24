import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/render";
import { PageNavigation } from "./PageNavigation";

const hrefForPage = (page: number) => `?page=${String(page)}`;

describe("PageNavigation", () => {
  it("renders nothing when everything fits on one page", () => {
    renderWithRouter(<PageNavigation page={1} totalPages={1} hrefForPage={hrefForPage} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("disables Previous on the first page and links Next to the following page", () => {
    renderWithRouter(<PageNavigation page={1} totalPages={3} hrefForPage={hrefForPage} />);

    expect(screen.queryByRole("link", { name: "Previous page" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/?page=2");
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  });

  it("disables Next on the last page", () => {
    renderWithRouter(<PageNavigation page={3} totalPages={3} hrefForPage={hrefForPage} />);

    expect(screen.queryByRole("link", { name: "Next page" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/?page=2");
  });
});
