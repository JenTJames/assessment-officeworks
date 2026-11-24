import { AppError } from "./app-error.ts";

export class UpstreamUnavailableError extends AppError {
  override name = "UpstreamUnavailableError";

  constructor(cause: Error) {
    super({
      code: "UPSTREAM_UNAVAILABLE",
      status: 503,
      message: "Product data is temporarily unavailable. Please try again shortly.",
      cause,
    });
  }
}
