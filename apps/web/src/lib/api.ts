import {
  categoryListSchema,
  categoryPageSchema,
  enquiryResponseSchema,
  productListSchema,
  productSchema,
  searchResultSchema,
  type Category,
  type CategoryPage,
  type CategorySlug,
  type EnquiryRequest,
  type EnquiryResponse,
  type PaginationQuery,
  type Product,
  type ProductId,
  type SearchResult,
} from "@catalogue/contracts";
import type { z } from "zod";
import { http } from "./http";

async function getParsed<Schema extends z.ZodType>(
  schema: Schema,
  url: string,
  params?: Record<string, string | number>,
): Promise<z.infer<Schema>> {
  const response = await http.get<z.input<Schema>>(url, { params });
  return schema.parse(response.data);
}

export function getFeaturedProducts(): Promise<Product[]> {
  return getParsed(productListSchema, "/featured-products");
}

export function getCategories(): Promise<Category[]> {
  return getParsed(categoryListSchema, "/categories");
}

export function getCategoryPage(
  slug: CategorySlug,
  { page, pageSize }: PaginationQuery,
): Promise<CategoryPage> {
  return getParsed(categoryPageSchema, `/categories/${encodeURIComponent(slug)}`, {
    page,
    pageSize,
  });
}

export function searchProducts(
  term: string,
  { page, pageSize }: PaginationQuery,
): Promise<SearchResult> {
  return getParsed(searchResultSchema, "/products", { term, page, pageSize });
}

export function getProduct(id: ProductId): Promise<Product> {
  return getParsed(productSchema, `/products/${encodeURIComponent(id)}`);
}

export async function submitEnquiry(enquiry: EnquiryRequest): Promise<EnquiryResponse> {
  const response = await http.post<z.input<typeof enquiryResponseSchema>>("/enquiries", enquiry);
  return enquiryResponseSchema.parse(response.data);
}
