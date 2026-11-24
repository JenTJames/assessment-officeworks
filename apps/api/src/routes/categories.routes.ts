import {
  categoryPageQuerySchema,
  categorySlugSchema,
  type Category,
  type CategoryPage,
} from "@catalogue/contracts";
import { Router, type Response } from "express";
import type { CatalogueService } from "../services/catalogue/catalogue-service.ts";

export function createCategoriesRouter(catalogueService: CatalogueService): Router {
  const router = Router();

  router.get("/", async (_request, response: Response<Category[]>) => {
    response.json(await catalogueService.listCategories());
  });

  router.get("/:slug", async (request, response: Response<CategoryPage>) => {
    const slug = categorySlugSchema.parse(request.params.slug);
    const query = categoryPageQuerySchema.parse(request.query);
    response.json(await catalogueService.getCategoryPage(slug, query));
  });

  return router;
}
