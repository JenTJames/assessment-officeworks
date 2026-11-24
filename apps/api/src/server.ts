import { buildApp } from "./app.ts";
import { InvalidEnvironmentError, loadEnv, type Env } from "./config/env.ts";
import { createContainer } from "./container.ts";

function readEnvOrExit(): Env {
  try {
    return loadEnv(process.env);
  } catch (error) {
    if (error instanceof InvalidEnvironmentError) {
      process.stderr.write(`Invalid environment configuration:\n${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

const env = readEnvOrExit();
const container = createContainer(env);
const { logger } = container;

const server = buildApp(container).listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, "API failed to start");
    process.exit(1);
  }
  logger.info({ port: env.PORT }, "API listening");
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, "Shutting down");
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Shutdown failed");
      process.exit(1);
    }
    process.exit(0);
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
