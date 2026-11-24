import type { CategorySlug } from "@catalogue/contracts";
import { useQuery } from "@tanstack/react-query";
import { catalogueConfig } from "@/config/catalogue";
import { getCategoryPage } from "@/lib/api";

export function useCategoryPage(slug: CategorySlug, page: number) {
  const pageSize = catalogueConfig.categoryPageSize;
  return useQuery({
    queryKey: ["category-page", slug, { page, pageSize }],
    queryFn: () => getCategoryPage(slug, { page, pageSize }),
    placeholderData: (previous) => (previous?.category.slug === slug ? previous : undefined),
  });
}
