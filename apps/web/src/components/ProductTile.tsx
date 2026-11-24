import type { Product } from "@catalogue/contracts";
import { Link } from "react-router";
import { paths } from "@/lib/paths";
import { PriceTag } from "./PriceTag";
import { ProductImage } from "./ProductImage";
import { RatingSummary } from "./RatingSummary";

type ProductTileProps = {
  product: Product;
};

export function ProductTile({ product }: ProductTileProps) {
  return (
    <Link
      to={paths.product(product.id)}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <ProductImage src={product.imageUrl} alt="" className="aspect-square" />
      <div className="flex flex-1 flex-col gap-1.5 border-t p-4">
        <span className="text-xs font-medium text-muted-foreground">{product.category.name}</span>
        <span className="line-clamp-2 min-h-[2lh] text-sm font-medium group-hover:underline">
          {product.title}
        </span>
        <RatingSummary rating={product.rating} className="text-[0.8125rem]" />
        <PriceTag price={product.price} className="mt-auto pt-1.5" />
      </div>
    </Link>
  );
}
