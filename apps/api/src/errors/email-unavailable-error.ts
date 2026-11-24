import { AppError } from "./app-error.ts";

export class EmailUnavailableError extends AppError {
  override name = "EmailUnavailableError";

  constructor(cause: Error) {
    super({
      code: "EMAIL_UNAVAILABLE",
      status: 503,
      message: "We couldn't send your enquiry right now. Please try again shortly.",
      cause,
    });
  }
}
