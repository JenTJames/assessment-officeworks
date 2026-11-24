import { z } from "zod";

const optionalUrl = z.union([z.literal("").transform(() => undefined), z.url()]).optional();
const optionalString = z
  .union([z.literal("").transform(() => undefined), z.string().min(1)])
  .optional();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(0).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    CORS_ORIGIN: z.url(),
    REDIS_URL: optionalUrl,
    FAKE_STORE_BASE_URL: z.url().default("https://fakestoreapi.com"),
    FAKE_STORE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    FEATURED_PRODUCTS_PATH: z.string().min(1).default("data/featured.json"),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    SMTP_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    MAIL_FROM: z.string().min(1),
    SALES_INBOX: z.email(),
    ENQUIRY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
    ENQUIRY_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  })
  .refine((env) => (env.SMTP_USER === undefined) === (env.SMTP_PASSWORD === undefined), {
    message: "Set SMTP_USER and SMTP_PASSWORD together, or neither",
    path: ["SMTP_PASSWORD"],
  });

export type Env = z.infer<typeof envSchema>;

export class InvalidEnvironmentError extends Error {
  override name = "InvalidEnvironmentError";
}

export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new InvalidEnvironmentError(z.prettifyError(result.error));
  }
  return result.data;
}
