import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type PageNavigationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

type StepLinkProps = {
  targetPage: number;
  enabled: boolean;
  label: string;
  hrefForPage: (page: number) => string;
  children: ReactNode;
};

function StepLink({ targetPage, enabled, label, hrefForPage, children }: StepLinkProps) {
  const className = cn(buttonVariants({ variant: "ghost" }), "h-10 gap-1 px-3");
  if (!enabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link to={hrefForPage(targetPage)} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

export function PageNavigation({ page, totalPages, hrefForPage }: PageNavigationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <Pagination aria-label="Pagination">
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          <StepLink
            targetPage={page - 1}
            enabled={page > 1}
            label="Previous page"
            hrefForPage={hrefForPage}
          >
            <ChevronLeftIcon aria-hidden="true" />
            <span className="hidden sm:block">Previous</span>
          </StepLink>
        </PaginationItem>
        {pages.map((pageNumber) => {
          const isCurrent = pageNumber === page;
          return (
            <PaginationItem key={pageNumber}>
              <Link
                to={hrefForPage(pageNumber)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${String(pageNumber)}`}
                className={cn(
                  buttonVariants({ variant: isCurrent ? "outline" : "ghost" }),
                  "size-10 font-semibold",
                )}
              >
                {pageNumber}
              </Link>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <StepLink
            targetPage={page + 1}
            enabled={page < totalPages}
            label="Next page"
            hrefForPage={hrefForPage}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon aria-hidden="true" />
          </StepLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
