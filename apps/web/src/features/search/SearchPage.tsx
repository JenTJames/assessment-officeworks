import { AsyncContent } from "@/components/AsyncContent";
import { ProductGridSkeleton } from "@/components/ProductGrid";
import { useListingParams } from "@/hooks/useListingParams";
import { SearchPrompt } from "./components/SearchPrompt";
import { SearchResults } from "./components/SearchResults";
import { useProductSearch } from "./hooks/useProductSearch";

export function SearchPage() {
  const { term, page, hrefForPage } = useListingParams();
  const search = useProductSearch(term, page);

  if (!term) {
    return <SearchPrompt />;
  }

  return (
    <AsyncContent state={search} loading={<ProductGridSkeleton count={4} />}>
      {(result) => <SearchResults term={term} result={result} hrefForPage={hrefForPage} />}
    </AsyncContent>
  );
}
