import type { RouteObject } from "react-router";
import { NotFoundState } from "@/components/NotFoundState";
import { CategoryPage } from "@/features/category/CategoryPage";
import { HomePage } from "@/features/home/HomePage";
import { ProductPage } from "@/features/product/ProductPage";
import { SearchPage } from "@/features/search/SearchPage";
import { routePatterns } from "@/lib/paths";
import { RootLayout } from "./layout/RootLayout";

export const routes: RouteObject[] = [
  {
    path: routePatterns.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: routePatterns.category, element: <CategoryPage /> },
      { path: routePatterns.search, element: <SearchPage /> },
      { path: routePatterns.product, element: <ProductPage /> },
      { path: "*", element: <NotFoundState /> },
    ],
  },
];
