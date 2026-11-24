import { Router, type RequestHandler } from "express";
import type { CatalogueService } from "../services/catalogue/catalogue-service.ts";
import type { EnquiryService } from "../services/enquiry/enquiry-service.ts";
import { createCategoriesRouter } from "./categories.routes.ts";
import { createEnquiriesRouter } from "./enquiries.routes.ts";
import { createFeaturedProductsRouter } from "./featured-products.routes.ts";
import { createProductsRouter } from "./products.routes.ts";

type ApiV1Options = {
  catalogueService: CatalogueService;
  enquiryService: EnquiryService;
  enquiryGuards: RequestHandler[];
};

export function createApiV1Router({
  catalogueService,
  enquiryService,
  enquiryGuards,
}: ApiV1Options): Router {
  const router = Router();
  router.use("/featured-products", createFeaturedProductsRouter(catalogueService));
  router.use("/categories", createCategoriesRouter(catalogueService));
  router.use("/products", createProductsRouter(catalogueService));
  router.use("/enquiries", createEnquiriesRouter({ enquiryService, guards: enquiryGuards }));
  return router;
}
