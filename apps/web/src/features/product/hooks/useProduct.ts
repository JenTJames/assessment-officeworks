import type { ProductId } from "@catalogue/contracts";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/lib/api";

export function useProduct(id: ProductId) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });
}
