import { useMutation } from "@tanstack/react-query";
import { submitEnquiry } from "@/lib/api";

export function useSubmitEnquiry() {
  return useMutation({ mutationFn: submitEnquiry });
}
