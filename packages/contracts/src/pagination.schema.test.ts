import { describe, expect, it } from "vitest";
import { z } from "zod";
import { pageSchema, paginationLimits, paginationQuerySchema } from "./pagination.schema.ts";

describe("paginationQuerySchema", () => {
  it("applies defaults when page and pageSize are absent", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      page: paginationLimits.defaultPage,
      pageSize: paginationLimits.defaultPageSize,
    });
  });

  it("coerces query string values", () => {
    expect(paginationQuerySchema.parse({ page: "3", pageSize: "6" })).toEqual({
      page: 3,
      pageSize: 6,
    });
  });

  it.each([
    { page: "0" },
    { page: "1.5" },
    { pageSize: "0" },
    { pageSize: String(paginationLimits.maxPageSize + 1) },
  ])("rejects %j", (query) => {
    expect(paginationQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe("pageSchema", () => {
  const numberPageSchema = pageSchema(z.number());

  it("validates items with the given item schema", () => {
    const meta = { page: 1, pageSize: 2, totalItems: 2, totalPages: 1 };

    expect(numberPageSchema.safeParse({ ...meta, items: [1, 2] }).success).toBe(true);
    expect(numberPageSchema.safeParse({ ...meta, items: ["1"] }).success).toBe(false);
  });
});
