import type { RequestHandler } from "express";
import type { Logger } from "pino";
import { z } from "zod";

type HoneypotOptions<Decoy> = {
  fieldName: string;
  decoyStatus: number;
  decoyBody: Decoy;
  logger: Logger;
};

export function createHoneypot<Decoy>({
  fieldName,
  decoyStatus,
  decoyBody,
  logger,
}: HoneypotOptions<Decoy>): RequestHandler {
  const trapSchema = z.object({ [fieldName]: z.string().trim().min(1) });

  return (request, response, next) => {
    if (trapSchema.safeParse(request.body).success) {
      logger.warn({ honeypot: fieldName, ip: request.ip }, "Honeypot field filled in; discarding");
      response.status(decoyStatus).json(decoyBody);
      return;
    }
    next();
  };
}
