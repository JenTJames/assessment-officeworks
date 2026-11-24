import { useNavigate } from "react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryNav } from "@/features/category/components/CategoryNav";
import { useCategories } from "@/features/category/hooks/useCategories";
import { SearchForm } from "@/features/search/components/SearchForm";
import { useListingParams } from "@/hooks/useListingParams";
import { paths } from "@/lib/paths";

export function SiteHeader() {
  const navigate = useNavigate();
  const { term } = useListingParams();
  const categories = useCategories();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-[75rem] flex-col gap-3 px-6 pt-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <BrandLogo />
          <div className="max-w-[35rem] flex-[1_1_20rem]">
            <SearchForm
              key={term}
              defaultTerm={term}
              onSearch={(nextTerm) => {
                void navigate(paths.search(nextTerm));
              }}
            />
          </div>
        </div>
        <CategoryNav categories={categories.data ?? []} />
      </div>
    </header>
  );
}
