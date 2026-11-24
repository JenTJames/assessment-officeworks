import type { Logger } from "pino";
import { pinoHttp } from "pino-http";

export function createRequestLogger(logger: Logger) {
  return pinoHttp({ logger });
}
