import { z } from "zod";
import { pageSchema, paginationQuerySchema } from "./pagination.schema.ts";
import { productSchema } from "./product.schema.ts";

export const searchTermMaxLength = 100;

export const searchQuerySchema = paginationQuerySchema.extend({
  term: z.string().trim().min(1, "Enter a search term").max(searchTermMaxLength),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchResultSchema = pageSchema(productSchema);

export type SearchResult = z.infer<typeof searchResultSchema>;
