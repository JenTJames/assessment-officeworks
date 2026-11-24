import type { RouteObject } from "react-router";
import { RootLayout } from "./layout/RootLayout";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: null }],
  },
];
