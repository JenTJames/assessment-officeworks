import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="flex flex-wrap gap-12">
      <Skeleton className="aspect-square max-h-[32.5rem] flex-[1_1_26rem] rounded-2xl" />
      <div className="flex flex-[1_1_24rem] flex-col gap-5">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
