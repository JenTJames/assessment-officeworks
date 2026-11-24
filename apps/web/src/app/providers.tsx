import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api-error";

const maxRetries = 1;

function shouldRetry(failureCount: number, error: Error): boolean {
  const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < maxRetries;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: shouldRetry, refetchOnWindowFocus: false },
    },
  });
}

type ProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export function Providers({ children, queryClient }: ProvidersProps) {
  const [defaultClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient ?? defaultClient}>{children}</QueryClientProvider>
  );
}
