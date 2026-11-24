import { describe, expect, it } from "vitest";
import { ApiError, describeError } from "./api-error";

describe("describeError", () => {
  it("shows the server's message for a missing resource without offering a retry", () => {
    const error = new ApiError({ status: 404, code: "NOT_FOUND", message: "Product not found" });

    expect(describeError(error)).toEqual({
      title: "Not found",
      message: "Product not found",
      canRetry: false,
    });
  });

  it("offers a retry for an unavailable upstream", () => {
    const error = new ApiError({ status: 503, code: "UPSTREAM_UNAVAILABLE", message: "Down" });

    expect(describeError(error)).toMatchObject({ message: "Down", canRetry: true });
  });

  it("never shows the details of an unexpected error", () => {
    expect(describeError(new Error("stack trace details"))).toMatchObject({
      message: "We couldn't load this right now. Please try again.",
      canRetry: true,
    });
  });
});
