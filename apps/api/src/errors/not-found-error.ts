import { AppError } from "./app-error.ts";

export class NotFoundError extends AppError {
  override name = "NotFoundError";

  constructor(message = "Resource not found") {
    super({ code: "NOT_FOUND", status: 404, message });
  }
}
