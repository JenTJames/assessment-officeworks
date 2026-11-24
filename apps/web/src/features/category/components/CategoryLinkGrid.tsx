import type { Category } from "@catalogue/contracts";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";
import { paths } from "@/lib/paths";

type CategoryLinkGridProps = {
  categories: Category[];
};

export function CategoryLinkGrid({ categories }: CategoryLinkGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-4">
      {categories.map((category) => (
        <li key={category.slug} className="flex *:w-full">
          <Link
            to={paths.category(category.slug)}
            className="flex items-center justify-between gap-3 rounded-xl border bg-muted/50 p-5 font-semibold transition-colors hover:border-ring"
          >
            {category.name}
            <ArrowRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
