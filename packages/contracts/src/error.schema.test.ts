import { describe, expect, it } from "vitest";
import { errorResponseSchema } from "./error.schema.ts";

describe("errorResponseSchema", () => {
  it("accepts an error envelope with field errors", () => {
    const result = errorResponseSchema.safeParse({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fields: { email: ["Required"] },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an envelope without a code", () => {
    const result = errorResponseSchema.safeParse({ error: { message: "Something failed" } });

    expect(result.success).toBe(false);
  });
});
