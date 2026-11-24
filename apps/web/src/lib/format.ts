import type { Price, Rating } from "@catalogue/contracts";
import { brand } from "@/config/brand";

const minorUnitsPerMajorUnit = 100;

export function formatPrice({ minorUnits, currency }: Price): string {
  return new Intl.NumberFormat(brand.locale, { style: "currency", currency }).format(
    minorUnits / minorUnitsPerMajorUnit,
  );
}

export function formatRatingAverage({ average }: Rating): string {
  return average.toFixed(1);
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${new Intl.NumberFormat(brand.locale).format(count)} ${count === 1 ? singular : plural}`;
}
