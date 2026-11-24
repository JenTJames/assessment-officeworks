import type { Price } from "@catalogue/contracts";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceTagProps = {
  price: Price;
  className?: string;
};

export function PriceTag({ price, className }: PriceTagProps) {
  return <span className={cn("font-bold", className)}>{formatPrice(price)}</span>;
}
