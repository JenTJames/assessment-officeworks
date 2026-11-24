import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { Container } from "./container.ts";
import { createErrorHandler } from "./middleware/error-handler.ts";
import { notFoundHandler } from "./middleware/not-found.ts";
import { createRequestLogger } from "./middleware/request-logger.ts";
import { createApiV1Router } from "./routes/api-v1.routes.ts";
import { createHealthRouter } from "./routes/health.routes.ts";

export function buildApp(container: Container): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: container.corsOrigin }));
  app.use(express.json({ limit: "16kb" }));
  app.use(createRequestLogger(container.logger));
  app.use("/health", createHealthRouter());
  app.use("/api/v1", createApiV1Router({ catalogueService: container.catalogueService }));
  app.use(notFoundHandler);
  app.use(createErrorHandler(container.logger));
  return app;
}
