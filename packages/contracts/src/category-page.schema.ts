import { z } from "zod";
import { categorySchema } from "./category.schema.ts";
import { pageSchema, paginationQuerySchema } from "./pagination.schema.ts";
import { productSchema } from "./product.schema.ts";

export const topRatedLimit = 3;

export const categoryPageQuerySchema = paginationQuerySchema;

export type CategoryPageQuery = z.infer<typeof categoryPageQuerySchema>;

export const categoryPageSchema = z
  .object({
    category: categorySchema,
    topRated: z.array(productSchema).max(topRatedLimit),
    remaining: pageSchema(productSchema),
  })
  .refine(
    ({ topRated, remaining }) => {
      const topRatedIds = new Set(topRated.map((product) => product.id));
      return remaining.items.every((product) => !topRatedIds.has(product.id));
    },
    { message: "A product must not appear in both topRated and remaining", path: ["remaining"] },
  );

export type CategoryPage = z.infer<typeof categoryPageSchema>;
