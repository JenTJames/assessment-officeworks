import {
  productIdSchema,
  searchQuerySchema,
  type Product,
  type SearchResult,
} from "@catalogue/contracts";
import { Router, type Response } from "express";
import type { CatalogueService } from "../services/catalogue/catalogue-service.ts";

export function createProductsRouter(catalogueService: CatalogueService): Router {
  const router = Router();

  router.get("/", async (request, response: Response<SearchResult>) => {
    const query = searchQuerySchema.parse(request.query);
    response.json(await catalogueService.searchProducts(query));
  });

  router.get("/:id", async (request, response: Response<Product>) => {
    const id = productIdSchema.parse(request.params.id);
    response.json(await catalogueService.getProduct(id));
  });

  return router;
}
