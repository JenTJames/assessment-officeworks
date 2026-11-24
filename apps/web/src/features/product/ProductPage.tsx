import { productIdSchema } from "@catalogue/contracts";
import { AsyncContent } from "@/components/AsyncContent";
import { NotFoundState } from "@/components/NotFoundState";
import { ProductEnquiry } from "@/features/enquiry/ProductEnquiry";
import { useRouteParam } from "@/hooks/useRouteParam";
import { ProductDetailsSkeleton } from "./components/ProductDetailsSkeleton";
import { ProductView } from "./components/ProductView";
import { useProduct } from "./hooks/useProduct";

export function ProductPage() {
  const id = useRouteParam("id", productIdSchema);
  return id ? <ProductContent id={id} /> : <NotFoundState />;
}

function ProductContent({ id }: { id: string }) {
  const product = useProduct(id);
  return (
    <AsyncContent state={product} loading={<ProductDetailsSkeleton />}>
      {(data) => (
        <ProductView
          product={data}
          enquiry={<ProductEnquiry key={data.id} productId={data.id} />}
        />
      )}
    </AsyncContent>
  );
}
