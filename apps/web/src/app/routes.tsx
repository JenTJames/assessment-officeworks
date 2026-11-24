import type { RouteObject } from "react-router";
import { CategoryPage } from "@/features/category/CategoryPage";
import { routePatterns } from "@/lib/paths";
import { RootLayout } from "./layout/RootLayout";

export const routes: RouteObject[] = [
  {
    path: routePatterns.home,
    element: <RootLayout />,
    children: [
      { index: true, element: null },
      { path: routePatterns.category, element: <CategoryPage /> },
    ],
  },
];
