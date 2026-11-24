import { paginationLimits, paginationQuerySchema } from "@catalogue/contracts";
import { useSearchParams } from "react-router";
import { pageParam, searchTermParam, withPage } from "@/lib/paths";

const pageFromParam = paginationQuerySchema.shape.page.catch(paginationLimits.defaultPage);

export type ListingParams = {
  page: number;
  term: string;
  hrefForPage: (page: number) => string;
};

export function useListingParams(): ListingParams {
  const [searchParams] = useSearchParams();
  return {
    page: pageFromParam.parse(searchParams.get(pageParam) ?? undefined),
    term: (searchParams.get(searchTermParam) ?? "").trim(),
    hrefForPage: (page) => withPage(searchParams, page),
  };
}
