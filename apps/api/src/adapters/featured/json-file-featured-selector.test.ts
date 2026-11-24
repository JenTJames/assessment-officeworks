import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pino } from "pino";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createJsonFileFeaturedSelector } from "./json-file-featured-selector.ts";

describe("JSON file featured selector", () => {
  let directory: string;
  let filePath: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "featured-"));
    filePath = join(directory, "featured.json");
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  function selector() {
    return createJsonFileFeaturedSelector({ filePath, logger: pino({ level: "silent" }) });
  }

  it("reads product ids in file order", async () => {
    await writeFile(filePath, '["3", "1", "SKU-9"]');

    expect(await selector().getFeaturedProductIds()).toEqual(["3", "1", "SKU-9"]);
  });

  it("accepts numeric ids", async () => {
    await writeFile(filePath, "[3, 1]");

    expect(await selector().getFeaturedProductIds()).toEqual(["3", "1"]);
  });

  it.each([
    ["an empty array", "[]"],
    ["an empty file", ""],
    ["a whitespace-only file", "  \n"],
    ["malformed JSON", "[1, 2"],
    ["a non-array", '{"ids": [1]}'],
    ["invalid ids", '["../1"]'],
  ])("returns no ids for %s", async (_label, contents) => {
    await writeFile(filePath, contents);

    expect(await selector().getFeaturedProductIds()).toEqual([]);
  });

  it("returns no ids when the file does not exist", async () => {
    expect(await selector().getFeaturedProductIds()).toEqual([]);
  });

  it("picks up edits without a restart", async () => {
    await writeFile(filePath, '["1"]');
    const featuredSelector = selector();
    await featuredSelector.getFeaturedProductIds();

    await writeFile(filePath, '["2"]');

    expect(await featuredSelector.getFeaturedProductIds()).toEqual(["2"]);
  });
});
