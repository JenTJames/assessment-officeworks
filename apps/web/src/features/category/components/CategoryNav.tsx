import type { Category } from "@catalogue/contracts";
import { NavLink } from "react-router";
import { paths } from "@/lib/paths";
import { cn } from "@/lib/utils";

type CategoryNavProps = {
  categories: Category[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-x-7 gap-y-1">
        {categories.map((category) => (
          <li key={category.slug}>
            <NavLink
              to={paths.category(category.slug)}
              className={({ isActive }) =>
                cn(
                  "inline-block border-b-2 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )
              }
            >
              {category.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
