import { Fragment } from "react";
import { Link } from "react-router";

export type Crumb = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted-foreground">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${String(index)}`}>
            {index > 0 ? <li aria-hidden="true">/</li> : null}
            <li>
              {item.to ? (
                <Link to={item.to} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
