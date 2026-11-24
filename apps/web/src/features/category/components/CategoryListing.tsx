import type { CategoryPage } from "@catalogue/contracts";
import { PackageOpenIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageNavigation } from "@/components/PageNavigation";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeading } from "@/components/SectionHeading";
import { StatusPanel } from "@/components/StatusPanel";
import { Badge } from "@/components/ui/badge";
import { brand } from "@/config/brand";
import { formatCount } from "@/lib/format";
import { paths } from "@/lib/paths";

type CategoryListingProps = {
  categoryPage: CategoryPage;
  hrefForPage: (page: number) => string;
};

export function CategoryListing({ categoryPage, hrefForPage }: CategoryListingProps) {
  const { category, topRated, remaining } = categoryPage;
  const totalProducts = topRated.length + remaining.totalItems;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Breadcrumbs items={[{ label: "Home", to: paths.home() }, { label: category.name }]} />
        <SectionHeading
          level={1}
          title={category.name}
          aside={
            <span className="text-sm text-muted-foreground">
              {formatCount(totalProducts, "product")}
            </span>
          }
        />
      </div>

      {totalProducts === 0 ? (
        <StatusPanel
          icon={PackageOpenIcon}
          title="No products yet"
          message="There are no products in this category right now."
        />
      ) : null}

      {topRated.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionHeading
            title={brand.copy.topRatedTitle}
            aside={
              <Badge className="mr-auto bg-highlight font-semibold text-highlight-foreground">
                {brand.copy.topRatedBadge}
              </Badge>
            }
          />
          <ProductGrid products={topRated} density="spacious" />
        </section>
      ) : null}

      {remaining.totalItems > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionHeading title={brand.copy.moreInCategoryTitle} />
          <ProductGrid products={remaining.items} />
          <PageNavigation
            page={remaining.page}
            totalPages={remaining.totalPages}
            hrefForPage={hrefForPage}
          />
        </section>
      ) : null}
    </div>
  );
}
