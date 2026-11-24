type ApiErrorDetails = {
  status: number;
  code: string;
  message: string;
};

export class ApiError extends Error {
  override name = "ApiError";
  readonly status: number;
  readonly code: string;

  constructor({ status, code, message }: ApiErrorDetails) {
    super(message);
    this.status = status;
    this.code = code;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export type ErrorDescription = {
  title: string;
  message: string;
  canRetry: boolean;
};

const genericError: ErrorDescription = {
  title: "Something went wrong",
  message: "We couldn't load this right now. Please try again.",
  canRetry: true,
};

export function describeError(error: Error): ErrorDescription {
  if (!(error instanceof ApiError)) {
    return genericError;
  }
  if (error.isNotFound) {
    return { title: "Not found", message: error.message, canRetry: false };
  }
  if (error.status >= 400 && error.status < 500) {
    return { title: "Something went wrong", message: error.message, canRetry: false };
  }
  return { ...genericError, message: error.status === 503 ? error.message : genericError.message };
}
