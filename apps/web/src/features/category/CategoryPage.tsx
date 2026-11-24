import { categorySlugSchema } from "@catalogue/contracts";
import { AsyncContent } from "@/components/AsyncContent";
import { ProductGridSkeleton } from "@/components/ProductGrid";
import { NotFoundState } from "@/components/NotFoundState";
import { useListingParams } from "@/hooks/useListingParams";
import { useRouteParam } from "@/hooks/useRouteParam";
import { CategoryListing } from "./components/CategoryListing";
import { useCategoryPage } from "./hooks/useCategoryPage";

export function CategoryPage() {
  const slug = useRouteParam("slug", categorySlugSchema);
  return slug ? <CategoryContent slug={slug} /> : <NotFoundState />;
}

function CategoryContent({ slug }: { slug: string }) {
  const { page, hrefForPage } = useListingParams();
  const categoryPage = useCategoryPage(slug, page);

  return (
    <AsyncContent
      state={categoryPage}
      loading={<ProductGridSkeleton count={3} density="spacious" />}
    >
      {(data) => <CategoryListing categoryPage={data} hrefForPage={hrefForPage} />}
    </AsyncContent>
  );
}
