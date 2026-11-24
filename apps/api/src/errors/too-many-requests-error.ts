import { AppError } from "./app-error.ts";

export class TooManyRequestsError extends AppError {
  override name = "TooManyRequestsError";

  constructor(message = "Too many requests. Please try again later.") {
    super({ code: "RATE_LIMITED", status: 429, message });
  }
}
