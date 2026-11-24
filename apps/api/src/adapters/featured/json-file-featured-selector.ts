import { readFile } from "node:fs/promises";
import { productIdSchema, type ProductId } from "@catalogue/contracts";
import type { Logger } from "pino";
import { z } from "zod";
import type { FeaturedSelector } from "../../ports/featured-selector.ts";

const featuredFileSchema = z.array(
  z.union([productIdSchema, z.number().int().nonnegative().transform(String)]),
);

type JsonFileFeaturedSelectorOptions = {
  filePath: string;
  logger: Logger;
};

function isMissingFileError(error: Error): boolean {
  return "code" in error && error.code === "ENOENT";
}

async function readFileContents(filePath: string, logger: Logger): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && isMissingFileError(error)) {
      logger.warn({ filePath }, "Featured products file not found; using top-rated products");
      return "";
    }
    throw error;
  }
}

function parseFeaturedIds(contents: string): ProductId[] | undefined {
  try {
    const parsed = featuredFileSchema.safeParse(JSON.parse(contents));
    return parsed.success ? parsed.data : undefined;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

export function createJsonFileFeaturedSelector({
  filePath,
  logger,
}: JsonFileFeaturedSelectorOptions): FeaturedSelector {
  return {
    async getFeaturedProductIds() {
      const contents = await readFileContents(filePath, logger);
      if (contents.trim() === "") {
        return [];
      }
      const ids = parseFeaturedIds(contents);
      if (ids === undefined) {
        logger.error(
          { filePath },
          "Featured products file is not a JSON array of product IDs; using top-rated products",
        );
        return [];
      }
      return ids;
    },
  };
}
