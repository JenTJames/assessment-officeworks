import type { ErrorResponse } from "@catalogue/contracts";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { electronics, jewellery } from "./fixtures";

export const apiUrl = (path: string) => `*/api/v1${path}`;

export const defaultHandlers = [
  http.get(apiUrl("/categories"), () => HttpResponse.json([electronics, jewellery])),
];

export const server = setupServer(...defaultHandlers);

export function errorResponse(status: number, code: string, message: string) {
  const body: ErrorResponse = { error: { code, message } };
  return HttpResponse.json(body, { status });
}
