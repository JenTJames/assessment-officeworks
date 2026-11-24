import { QueryClient } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Providers } from "@/app/providers";
import { routes } from "@/app/routes";

function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function renderRoute(path: string): RenderResult {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <Providers queryClient={createTestQueryClient()}>
      <RouterProvider router={router} />
    </Providers>,
  );
}

export function renderWithRouter(element: ReactElement): RenderResult {
  const router = createMemoryRouter([{ path: "*", element }]);
  return render(<RouterProvider router={router} />);
}
