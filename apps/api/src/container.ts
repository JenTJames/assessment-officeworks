import { pino, type Logger } from "pino";
import type { Env } from "./config/env.ts";

export type Container = {
  env: Env;
  logger: Logger;
};

function createLogger(env: Env): Logger {
  const prettyTransport =
    env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : {};
  return pino({ level: env.LOG_LEVEL, ...prettyTransport });
}

export function createContainer(env: Env): Container {
  return { env, logger: createLogger(env) };
}
