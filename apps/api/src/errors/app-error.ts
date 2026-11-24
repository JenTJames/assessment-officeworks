export type FieldErrors = Record<string, string[]>;

type AppErrorDetails = {
  code: string;
  status: number;
  message: string;
  fields?: FieldErrors;
};

export class AppError extends Error {
  override name = "AppError";
  readonly code: string;
  readonly status: number;
  readonly fields: FieldErrors | undefined;

  constructor(details: AppErrorDetails) {
    super(details.message);
    this.code = details.code;
    this.status = details.status;
    this.fields = details.fields;
  }
}
