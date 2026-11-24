import type { ErrorResponse } from "@catalogue/contracts";
import type { NextFunction, Request, Response } from "express";
import type { Logger } from "pino";
import { ZodError } from "zod";
import { AppError, type FieldErrors } from "../errors/app-error.ts";

function toFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_root";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

function clientErrorStatus(error: Error): number | undefined {
  if (
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return error.status;
  }
  return undefined;
}

function toResponse(error: Error): { status: number; body: ErrorResponse } {
  if (error instanceof AppError) {
    const fields = error.fields ? { fields: error.fields } : {};
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message, ...fields } },
    };
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          fields: toFieldErrors(error),
        },
      },
    };
  }
  const status = clientErrorStatus(error);
  if (status !== undefined) {
    return { status, body: { error: { code: "BAD_REQUEST", message: error.message } } };
  }
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
  };
}

export function createErrorHandler(logger: Logger) {
  return (
    error: Error,
    _request: Request,
    response: Response<ErrorResponse>,
    _next: NextFunction,
  ): void => {
    const { status, body } = toResponse(error);
    if (status >= 500) {
      logger.error({ err: error }, "Unhandled error");
    }
    response.status(status).json(body);
  };
}
