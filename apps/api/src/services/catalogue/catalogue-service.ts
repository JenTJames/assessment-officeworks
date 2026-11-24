import {
  topRatedLimit,
  type Category,
  type CategoryPage,
  type CategoryPageQuery,
  type CategorySlug,
  type Product,
  type ProductId,
  type SearchQuery,
  type SearchResult,
} from "@catalogue/contracts";
import { NotFoundError } from "../../errors/not-found-error.ts";
import type { FeaturedSelector } from "../../ports/featured-selector.ts";
import type { ProductSource } from "../../ports/product-source.ts";

export const featuredProductCount = 5;

export type CatalogueService = {
  getFeaturedProducts(): Promise<Product[]>;
  listCategories(): Promise<Category[]>;
  getCategoryPage(slug: CategorySlug, query: CategoryPageQuery): Promise<CategoryPage>;
  searchProducts(query: SearchQuery): Promise<SearchResult>;
  getProduct(id: ProductId): Promise<Product>;
};

type CatalogueServiceDependencies = {
  productSource: ProductSource;
  featuredSelector: FeaturedSelector;
};

function isProduct(product: Product | undefined): product is Product {
  return product !== undefined;
}

export function createCatalogueService({
  productSource,
  featuredSelector,
}: CatalogueServiceDependencies): CatalogueService {
  async function findTopRated(
    limit: number,
    filter: { categorySlug?: CategorySlug; excludeIds?: readonly ProductId[] } = {},
  ): Promise<Product[]> {
    const page = await productSource.findProducts({
      ...filter,
      sort: "rating-desc",
      page: 1,
      pageSize: limit,
    });
    return page.items;
  }

  async function findConfiguredFeatured(): Promise<Product[]> {
    const configuredIds = [...new Set(await featuredSelector.getFeaturedProductIds())];
    const products = await Promise.all(
      configuredIds.map((id) => productSource.findProductById(id)),
    );
    return products.filter(isProduct).slice(0, featuredProductCount);
  }

  return {
    async getFeaturedProducts() {
      const configured = await findConfiguredFeatured();
      if (configured.length === featuredProductCount) {
        return configured;
      }
      const fillers = await findTopRated(featuredProductCount - configured.length, {
        excludeIds: configured.map((product) => product.id),
      });
      return [...configured, ...fillers];
    },

    listCategories() {
      return productSource.listCategories();
    },

    async getCategoryPage(slug, { page, pageSize }) {
      const category = (await productSource.listCategories()).find(
        (candidate) => candidate.slug === slug,
      );
      if (category === undefined) {
        throw new NotFoundError(`Category "${slug}" not found`);
      }
      const topRated = await findTopRated(topRatedLimit, { categorySlug: slug });
      const remaining = await productSource.findProducts({
        categorySlug: slug,
        excludeIds: topRated.map((product) => product.id),
        sort: "rating-desc",
        page,
        pageSize,
      });
      return { category, topRated, remaining };
    },

    searchProducts({ term, page, pageSize }) {
      return productSource.findProducts({ search: term, page, pageSize });
    },

    async getProduct(id) {
      const product = await productSource.findProductById(id);
      if (product === undefined) {
        throw new NotFoundError(`Product "${id}" not found`);
      }
      return product;
    },
  };
}
