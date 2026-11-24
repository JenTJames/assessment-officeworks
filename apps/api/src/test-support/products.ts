import type { Category, Product } from "@catalogue/contracts";

export const electronics: Category = { slug: "electronics", name: "Electronics" };
export const jewellery: Category = { slug: "jewellery", name: "Jewellery" };
export const mensClothing: Category = { slug: "mens-clothing", name: "Men's clothing" };

type ProductOverrides = Partial<Omit<Product, "rating">> & {
  id: string;
  rating?: [average: number, count: number];
};

export function buildProduct({ rating = [3, 10], ...overrides }: ProductOverrides): Product {
  const [average, count] = rating;
  return {
    title: `Product ${overrides.id}`,
    description: `Description of product ${overrides.id}`,
    price: { minorUnits: 1999, currency: "USD" },
    category: electronics,
    imageUrl: `https://images.example.com/${overrides.id}.png`,
    ...overrides,
    rating: { average, count },
  };
}

export const catalogueProducts: Product[] = [
  buildProduct({
    id: "1",
    title: "Fjallraven Backpack",
    description: "Fits 15 inch laptops",
    category: mensClothing,
    rating: [3.9, 120],
  }),
  buildProduct({
    id: "2",
    title: "Mens Casual T-Shirt",
    description: "Slim fit",
    category: mensClothing,
    rating: [4.1, 259],
  }),
  buildProduct({
    id: "3",
    title: "Mens Cotton Jacket",
    description: "Great outerwear",
    category: mensClothing,
    rating: [4.7, 500],
  }),
  buildProduct({
    id: "4",
    title: "Mens Casual Slim Fit",
    description: "Color may vary",
    category: mensClothing,
    rating: [2.1, 430],
  }),
  buildProduct({
    id: "5",
    title: "Dragon Bracelet",
    description: "Silver chain",
    category: jewellery,
    rating: [4.6, 400],
  }),
  buildProduct({
    id: "6",
    title: "Solid Gold Petite",
    description: "Satisfaction guaranteed",
    category: jewellery,
    rating: [3.9, 70],
  }),
  buildProduct({
    id: "7",
    title: "External Hard Drive",
    description: "USB 3.0 BACKPACK-sized storage",
    category: electronics,
    rating: [3.3, 203],
  }),
  buildProduct({
    id: "8",
    title: "SSD 1TB",
    description: "Fast boot",
    category: electronics,
    rating: [2.9, 470],
  }),
  buildProduct({
    id: "9",
    title: "Gaming Monitor",
    description: "49 inch curved",
    category: electronics,
    rating: [2.2, 140],
  }),
  buildProduct({
    id: "10",
    title: "Portable SSD",
    description: "Rugged",
    category: electronics,
    rating: [4.8, 319],
  }),
  buildProduct({
    id: "11",
    title: "Wireless Mouse",
    description: "Ergonomic",
    category: electronics,
    rating: [4.8, 100],
  }),
  buildProduct({
    id: "12",
    title: "Laptop Stand",
    description: "Aluminium",
    category: electronics,
    rating: [1.9, 100],
  }),
];
