import type { Product } from "@catalogue/contracts";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { paths } from "@/lib/paths";
import { ProductDetails } from "./ProductDetails";

type ProductViewProps = {
  product: Product;
};

export function ProductView({ product }: ProductViewProps) {
  return (
    <div className="flex flex-col gap-10">
      <Breadcrumbs
        items={[
          { label: "Home", to: paths.home() },
          { label: product.category.name, to: paths.category(product.category.slug) },
          { label: product.title },
        ]}
      />
      <ProductDetails product={product} />
    </div>
  );
}
