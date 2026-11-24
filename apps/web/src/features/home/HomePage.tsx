import { AsyncContent } from "@/components/AsyncContent";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { SectionHeading } from "@/components/SectionHeading";
import { brand } from "@/config/brand";
import { catalogueConfig } from "@/config/catalogue";
import { CategoryLinkGrid } from "@/features/category/components/CategoryLinkGrid";
import { useCategories } from "@/features/category/hooks/useCategories";
import { useFeaturedProducts } from "./hooks/useFeaturedProducts";

export function HomePage() {
  const featured = useFeaturedProducts();
  const categories = useCategories();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <SectionHeading
          level={1}
          title={brand.copy.featuredTitle}
          description={brand.copy.featuredDescription}
        />
        <AsyncContent
          state={featured}
          loading={
            <ProductGridSkeleton
              count={catalogueConfig.featuredPlaceholderCount}
              density="compact"
            />
          }
        >
          {(products) => <ProductGrid products={products} density="compact" />}
        </AsyncContent>
      </section>
      <section className="flex flex-col gap-5">
        <SectionHeading title={brand.copy.shopByCategoryTitle} />
        <AsyncContent state={categories} loading={null}>
          {(list) => <CategoryLinkGrid categories={list} />}
        </AsyncContent>
      </section>
    </div>
  );
}
