import { AppError, type FieldErrors } from "./app-error.ts";

export class ValidationError extends AppError {
  override name = "ValidationError";

  constructor(fields: FieldErrors, message = "Request validation failed") {
    super({ code: "VALIDATION_ERROR", status: 400, message, fields });
  }
}
