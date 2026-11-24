import { z } from "zod";

export const paginationLimits = {
  defaultPage: 1,
  defaultPageSize: 4,
  maxPageSize: 48,
} as const;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(paginationLimits.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(paginationLimits.maxPageSize)
    .default(paginationLimits.defaultPageSize),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const pageMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

export type Page<Item> = PageMeta & { items: Item[] };

export function pageSchema<ItemSchema extends z.ZodType>(itemSchema: ItemSchema) {
  return pageMetaSchema.extend({ items: z.array(itemSchema) });
}
