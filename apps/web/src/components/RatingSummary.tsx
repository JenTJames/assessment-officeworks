import type { Rating } from "@catalogue/contracts";
import { StarIcon } from "lucide-react";
import { formatCount, formatRatingAverage } from "@/lib/format";
import { cn } from "@/lib/utils";

type RatingSummaryProps = {
  rating: Rating;
  className?: string;
};

export function RatingSummary({ rating, className }: RatingSummaryProps) {
  const average = formatRatingAverage(rating);
  const count = formatCount(rating.count, "rating");
  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
      <span className="sr-only">{`Rated ${average} out of 5 from ${count}`}</span>
      <StarIcon aria-hidden="true" className="size-[1em] fill-rating text-rating" />
      <span aria-hidden="true" className="font-semibold text-foreground">
        {average}
      </span>
      <span aria-hidden="true">({count})</span>
    </div>
  );
}
