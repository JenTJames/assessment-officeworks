export type ApiFieldErrors = Record<string, string[]>;

type ApiErrorDetails = {
  status: number;
  code: string;
  message: string;
  fields?: ApiFieldErrors;
};

export class ApiError extends Error {
  override name = "ApiError";
  readonly status: number;
  readonly code: string;
  readonly fields: ApiFieldErrors;

  constructor({ status, code, message, fields = {} }: ApiErrorDetails) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
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
