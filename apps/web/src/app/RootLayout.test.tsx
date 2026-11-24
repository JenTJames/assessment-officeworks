import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";
import { Providers } from "./providers";
import { routes } from "./routes";

describe("RootLayout", () => {
  it("renders the brand name in the header", async () => {
    render(
      <Providers>
        <RouterProvider router={createMemoryRouter(routes)} />
      </Providers>,
    );

    expect(await screen.findByRole("link", { name: brand.name })).toBeInTheDocument();
  });
});
