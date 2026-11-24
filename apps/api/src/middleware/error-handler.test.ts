import { errorResponseSchema } from "@catalogue/contracts";
import express from "express";
import { pino } from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "../errors/validation-error.ts";
import { createErrorHandler } from "./error-handler.ts";

function appThrowing(error: Error) {
  const app = express();
  app.get("/", () => {
    throw error;
  });
  app.use(createErrorHandler(pino({ level: "silent" })));
  return app;
}

describe("error handler", () => {
  it("maps an AppError to its status and fields", async () => {
    const response = await request(
      appThrowing(new ValidationError({ email: ["Invalid email"] })),
    ).get("/");

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body)).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        fields: { email: ["Invalid email"] },
      },
    });
  });

  it("maps a ZodError to field errors", async () => {
    const parsed = z.object({ name: z.string() }).safeParse({});
    const zodError = parsed.success ? new Error("expected failure") : parsed.error;

    const response = await request(appThrowing(zodError)).get("/");

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.fields).toHaveProperty("name");
  });

  it("hides internal error details", async () => {
    const response = await request(appThrowing(new Error("database password leaked"))).get("/");

    expect(response.status).toBe(500);
    expect(errorResponseSchema.parse(response.body).error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  });
});
