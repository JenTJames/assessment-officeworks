import { describe, expect, it } from "vitest";
import { paginationLimits } from "./pagination.schema.ts";
import { searchQuerySchema, searchTermMaxLength } from "./search.schema.ts";

describe("searchQuerySchema", () => {
  it("trims the term and applies pagination defaults", () => {
    expect(searchQuerySchema.parse({ term: "  backpack " })).toEqual({
      term: "backpack",
      page: paginationLimits.defaultPage,
      pageSize: paginationLimits.defaultPageSize,
    });
  });

  it.each(["", "   ", "x".repeat(searchTermMaxLength + 1)])("rejects term %j", (term) => {
    expect(searchQuerySchema.safeParse({ term }).success).toBe(false);
  });
});
