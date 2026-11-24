import { productSchema, type Category, type Product } from "@catalogue/contracts";
import { z } from "zod";

export const fakeStoreProductSchema = z.object({
  id: z.number().int().nonnegative(),
  title: z.string(),
  price: z.number().nonnegative(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number(),
    count: z.number().int(),
  }),
});

export type FakeStoreProduct = z.infer<typeof fakeStoreProductSchema>;

const upstreamCategorySpellings: Record<string, string> = {
  jewelery: "jewellery",
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function toCategory(upstreamName: string): Category {
  const trimmed = upstreamName.trim().toLowerCase();
  const name = upstreamCategorySpellings[trimmed] ?? trimmed;
  return { slug: toSlug(name), name: capitalise(name) };
}

export function toMinorUnits(price: number): number {
  return Math.round(price * 100);
}

export function toProduct(upstream: FakeStoreProduct): Product | undefined {
  const mapped = productSchema.safeParse({
    id: String(upstream.id),
    title: upstream.title.trim(),
    description: upstream.description.trim(),
    price: { minorUnits: toMinorUnits(upstream.price), currency: "USD" },
    rating: { average: upstream.rating.rate, count: upstream.rating.count },
    category: toCategory(upstream.category),
    imageUrl: upstream.image,
  });
  return mapped.success ? mapped.data : undefined;
}
