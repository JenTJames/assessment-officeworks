import { z } from "zod";

export const categorySlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase, hyphen-separated slug");

export type CategorySlug = z.infer<typeof categorySlugSchema>;

export const categorySchema = z.object({
  slug: categorySlugSchema,
  name: z.string().trim().min(1),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryListSchema = z.array(categorySchema);
