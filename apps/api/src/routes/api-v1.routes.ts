import { Router } from "express";
import type { CatalogueService } from "../services/catalogue/catalogue-service.ts";
import { createCategoriesRouter } from "./categories.routes.ts";
import { createFeaturedProductsRouter } from "./featured-products.routes.ts";
import { createProductsRouter } from "./products.routes.ts";

type ApiV1Services = {
  catalogueService: CatalogueService;
};

export function createApiV1Router({ catalogueService }: ApiV1Services): Router {
  const router = Router();
  router.use("/featured-products", createFeaturedProductsRouter(catalogueService));
  router.use("/categories", createCategoriesRouter(catalogueService));
  router.use("/products", createProductsRouter(catalogueService));
  return router;
}
