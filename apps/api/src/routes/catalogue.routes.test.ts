import {
  categoryListSchema,
  categoryPageSchema,
  errorResponseSchema,
  paginationLimits,
  productListSchema,
  productSchema,
  searchResultSchema,
} from "@catalogue/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.ts";
import { UpstreamUnavailableError } from "../errors/upstream-unavailable-error.ts";
import { buildTestContainer } from "../test-support/test-container.ts";

const app = buildApp(buildTestContainer({ featuredIds: ["7"] }));

describe("GET /api/v1/featured-products", () => {
  it("returns 5 products matching the contract", async () => {
    const response = await request(app).get("/api/v1/featured-products");

    expect(response.status).toBe(200);
    const products = productListSchema.parse(response.body);
    expect(products).toHaveLength(5);
    expect(products[0]?.id).toBe("7");
  });
});

describe("GET /api/v1/categories", () => {
  it("lists categories", async () => {
    const response = await request(app).get("/api/v1/categories");

    expect(response.status).toBe(200);
    expect(categoryListSchema.parse(response.body).map((category) => category.slug)).toContain(
      "jewellery",
    );
  });
});

describe("GET /api/v1/categories/:slug", () => {
  it("returns a category page using the default page size", async () => {
    const response = await request(app).get("/api/v1/categories/electronics");

    expect(response.status).toBe(200);
    const page = categoryPageSchema.parse(response.body);
    expect(page.topRated).toHaveLength(3);
    expect(page.remaining.pageSize).toBe(paginationLimits.defaultPageSize);
  });

  it("honours page and pageSize", async () => {
    const response = await request(app).get("/api/v1/categories/electronics?page=2&pageSize=2");

    expect(categoryPageSchema.parse(response.body).remaining).toMatchObject({
      page: 2,
      pageSize: 2,
    });
  });

  it("returns 404 for an unknown category", async () => {
    const response = await request(app).get("/api/v1/categories/garden");

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("NOT_FOUND");
  });

  it("returns 400 with field errors for an invalid slug or page", async () => {
    const response = await request(app).get("/api/v1/categories/Not%20A%20Slug?page=0");

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.fields).toHaveProperty("_root");
  });

  it("returns 400 for an invalid page", async () => {
    const response = await request(app).get("/api/v1/categories/electronics?page=0");

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.fields).toHaveProperty("page");
  });
});

describe("GET /api/v1/products?term=", () => {
  it("searches title and description case-insensitively", async () => {
    const response = await request(app).get("/api/v1/products").query({ term: "BACKPACK" });

    expect(response.status).toBe(200);
    expect(searchResultSchema.parse(response.body).items.map((product) => product.id)).toEqual([
      "1",
      "7",
    ]);
  });

  it("returns 400 when the term is missing or blank", async () => {
    const response = await request(app).get("/api/v1/products").query({ term: "   " });

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(response.body).error.fields).toHaveProperty("term");
  });
});

describe("GET /api/v1/products/:id", () => {
  it("returns the product", async () => {
    const response = await request(app).get("/api/v1/products/3");

    expect(response.status).toBe(200);
    expect(productSchema.parse(response.body).title).toBe("Mens Cotton Jacket");
  });

  it("returns 404 for an unknown product", async () => {
    const response = await request(app).get("/api/v1/products/999");

    expect(response.status).toBe(404);
  });
});

describe("when product data is unavailable", () => {
  it("returns 503 with the error envelope", async () => {
    const failingApp = buildApp(
      buildTestContainer({
        feed: {
          fetchAllProducts: () => Promise.reject(new UpstreamUnavailableError(new Error("down"))),
        },
      }),
    );

    const response = await request(failingApp).get("/api/v1/featured-products");

    expect(response.status).toBe(503);
    expect(errorResponseSchema.parse(response.body).error.code).toBe("UPSTREAM_UNAVAILABLE");
  });
});
