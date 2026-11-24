import type { Request } from "express";
import { NotFoundError } from "../errors/not-found-error.ts";

export function notFoundHandler(request: Request): never {
  throw new NotFoundError(`Route ${request.method} ${request.path} not found`);
}
