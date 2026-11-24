import { useQuery } from "@tanstack/react-query";
import { catalogueConfig } from "@/config/catalogue";
import { searchProducts } from "@/lib/api";

export function useProductSearch(term: string, page: number) {
  const pageSize = catalogueConfig.searchPageSize;
  return useQuery({
    queryKey: ["product-search", term, { page, pageSize }],
    queryFn: () => searchProducts(term, { page, pageSize }),
    enabled: term.length > 0,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === term ? previous : undefined,
  });
}
