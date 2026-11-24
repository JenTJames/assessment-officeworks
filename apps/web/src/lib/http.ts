import { errorResponseSchema } from "@catalogue/contracts";
import axios from "axios";
import { ApiError } from "./api-error";

export const http = axios.create({
  baseURL: "/api/v1",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

const networkError = new ApiError({
  status: 0,
  code: "NETWORK_ERROR",
  message: "We couldn't reach the server. Check your connection and try again.",
});

export function toApiError(error: Error): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return networkError;
  }
  const { status } = error.response;
  const envelope = errorResponseSchema.safeParse(error.response.data);
  if (!envelope.success) {
    return new ApiError({ status, code: "UNKNOWN_ERROR", message: error.message });
  }
  return new ApiError({ status, ...envelope.data.error });
}

http.interceptors.response.use(undefined, (error: Error) => Promise.reject(toApiError(error)));
