import type { Product } from "@catalogue/contracts";
import { Router, type Response } from "express";
import type { CatalogueService } from "../services/catalogue/catalogue-service.ts";

export function createFeaturedProductsRouter(catalogueService: CatalogueService): Router {
  const router = Router();

  router.get("/", async (_request, response: Response<Product[]>) => {
    response.json(await catalogueService.getFeaturedProducts());
  });

  return router;
}
