import { honeypotFieldName, type EnquiryResponse } from "@catalogue/contracts";
import cors from "cors";
import express, { type Express, type RequestHandler } from "express";
import helmet from "helmet";
import type { Container } from "./container.ts";
import { createErrorHandler } from "./middleware/error-handler.ts";
import { createHoneypot } from "./middleware/honeypot.ts";
import { notFoundHandler } from "./middleware/not-found.ts";
import { createRateLimiter } from "./middleware/rate-limit.ts";
import { createRequestLogger } from "./middleware/request-logger.ts";
import { createApiV1Router } from "./routes/api-v1.routes.ts";
import { createHealthRouter } from "./routes/health.routes.ts";

const enquiryReceived: EnquiryResponse = { status: "received" };

function createEnquiryGuards({ enquiryRateLimit, logger }: Container): RequestHandler[] {
  return [
    createRateLimiter({
      ...enquiryRateLimit,
      message: "You've sent several enquiries recently. Please wait a few minutes and try again.",
      logger,
    }),
    createHoneypot({
      fieldName: honeypotFieldName,
      decoyStatus: 202,
      decoyBody: enquiryReceived,
      logger,
    }),
  ];
}

export function buildApp(container: Container): Express {
  const app = express();
  app.set("trust proxy", container.trustProxyHops);
  app.use(helmet());
  app.use(cors({ origin: container.corsOrigin }));
  app.use(express.json({ limit: "16kb" }));
  app.use(createRequestLogger(container.logger));
  app.use("/health", createHealthRouter());
  app.use(
    "/api/v1",
    createApiV1Router({
      catalogueService: container.catalogueService,
      enquiryService: container.enquiryService,
      enquiryGuards: createEnquiryGuards(container),
    }),
  );
  app.use(notFoundHandler);
  app.use(createErrorHandler(container.logger));
  return app;
}
