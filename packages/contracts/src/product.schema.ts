import { z } from "zod";
import { categorySchema } from "./category.schema.ts";

export const productIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/, "Must be 1-64 letters, digits, hyphens or underscores");

export type ProductId = z.infer<typeof productIdSchema>;

export const currencySchema = z.literal("USD");

export type Currency = z.infer<typeof currencySchema>;

export const priceSchema = z.object({
  minorUnits: z.number().int().min(0),
  currency: currencySchema,
});

export type Price = z.infer<typeof priceSchema>;

export const ratingSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().min(0),
});

export type Rating = z.infer<typeof ratingSchema>;

export const productSchema = z.object({
  id: productIdSchema,
  title: z.string().trim().min(1),
  description: z.string(),
  price: priceSchema,
  rating: ratingSchema,
  category: categorySchema,
  imageUrl: z.url({ protocol: /^https?$/ }),
});

export type Product = z.infer<typeof productSchema>;

export const productListSchema = z.array(productSchema);
