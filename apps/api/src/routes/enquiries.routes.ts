import { enquiryRequestSchema, type EnquiryResponse } from "@catalogue/contracts";
import { Router, type RequestHandler, type Response } from "express";
import type { EnquiryService } from "../services/enquiry/enquiry-service.ts";

type EnquiriesRouterOptions = {
  enquiryService: EnquiryService;
  guards: RequestHandler[];
};

export function createEnquiriesRouter({ enquiryService, guards }: EnquiriesRouterOptions): Router {
  const router = Router();

  router.post("/", ...guards, async (request, response: Response<EnquiryResponse>) => {
    const enquiry = enquiryRequestSchema.parse(request.body);
    response.status(202).json(await enquiryService.submitEnquiry(enquiry));
  });

  return router;
}
