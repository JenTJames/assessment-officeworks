import type { SearchResult } from "@catalogue/contracts";
import { SearchXIcon } from "lucide-react";
import { PageNavigation } from "@/components/PageNavigation";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionHeading } from "@/components/SectionHeading";
import { StatusPanel } from "@/components/StatusPanel";
import { formatCount } from "@/lib/format";

type SearchResultsProps = {
  term: string;
  result: SearchResult;
  hrefForPage: (page: number) => string;
};

export function SearchResults({ term, result, hrefForPage }: SearchResultsProps) {
  const heading = `Results for “${term}”`;

  if (result.totalItems === 0) {
    return (
      <div className="flex flex-col gap-10">
        <SectionHeading level={1} title={heading} />
        <StatusPanel
          icon={SearchXIcon}
          title="No products found"
          message="Try a different word, or check the spelling."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <SectionHeading
        level={1}
        title={heading}
        description={`${formatCount(result.totalItems, "product")} match in title or description`}
      />
      <ProductGrid products={result.items} />
      <PageNavigation page={result.page} totalPages={result.totalPages} hrefForPage={hrefForPage} />
    </div>
  );
}
