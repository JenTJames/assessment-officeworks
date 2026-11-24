import type { Product } from "@catalogue/contracts";
import { cva, type VariantProps } from "class-variance-authority";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductTile } from "./ProductTile";

const productGridVariants = cva("grid gap-5", {
  variants: {
    density: {
      compact: "grid-cols-[repeat(auto-fill,minmax(min(11.875rem,100%),1fr))]",
      comfortable: "grid-cols-[repeat(auto-fill,minmax(min(13.75rem,100%),1fr))]",
      spacious: "grid-cols-[repeat(auto-fill,minmax(min(17.5rem,100%),1fr))]",
    },
  },
  defaultVariants: { density: "comfortable" },
});

export type ProductGridDensity = NonNullable<VariantProps<typeof productGridVariants>["density"]>;

type ProductGridProps = {
  products: Product[];
  density?: ProductGridDensity;
};

export function ProductGrid({ products, density }: ProductGridProps) {
  return (
    <ul className={productGridVariants({ density })}>
      {products.map((product) => (
        <li key={product.id} className="flex *:w-full">
          <ProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}

type ProductGridSkeletonProps = {
  count: number;
  density?: ProductGridDensity;
};

export function ProductGridSkeleton({ count, density }: ProductGridSkeletonProps) {
  return (
    <div className={productGridVariants({ density })} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-xl border">
          <Skeleton className="aspect-square rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
