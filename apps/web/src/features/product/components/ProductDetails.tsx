import type { Product } from "@catalogue/contracts";
import { Link } from "react-router";
import { PriceTag } from "@/components/PriceTag";
import { ProductImage } from "@/components/ProductImage";
import { RatingSummary } from "@/components/RatingSummary";
import { Badge } from "@/components/ui/badge";
import { paths } from "@/lib/paths";

type ProductDetailsProps = {
  product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <article className="flex flex-wrap items-start gap-12">
      <ProductImage
        src={product.imageUrl}
        alt={product.title}
        className="aspect-square max-h-[32.5rem] flex-[1_1_26rem] rounded-2xl border p-10"
      />
      <div className="flex flex-[1_1_24rem] flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <Badge asChild variant="secondary" className="px-2.5 py-1 font-semibold">
            <Link to={paths.category(product.category.slug)}>{product.category.name}</Link>
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          <RatingSummary rating={product.rating} className="text-sm" />
        </div>
        <PriceTag price={product.price} className="text-3xl" />
        <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
          {product.description}
        </p>
      </div>
    </article>
  );
}
