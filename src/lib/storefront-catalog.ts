import type { CategoryWithChildren, ProductWithRelations } from "@/lib/types";

const HIDDEN_STOREFRONT_CATEGORY_SLUGS = new Set(["puntos-organic"]);
const COLOR_GEL_SLUG = "color-gel";
const COLOR_GEL_COLLECTION_PATTERN = /\b(?:pastel\s+show|xpectrum|espectro)\b/i;

const catalogNameCollator = new Intl.Collator("es-CO", {
  ignorePunctuation: true,
  numeric: true,
  sensitivity: "base",
});

export function getVisibleStorefrontCategories(
  categories: CategoryWithChildren[]
): CategoryWithChildren[] {
  return categories.filter(
    (category) => !HIDDEN_STOREFRONT_CATEGORY_SLUGS.has(category.slug)
  );
}

export function isColorGelCategory(
  categories: CategoryWithChildren[],
  categorySlug?: string
): boolean {
  if (!categorySlug) return false;

  const colorGel = categories.find((category) => category.slug === COLOR_GEL_SLUG);
  return (
    colorGel?.slug === categorySlug ||
    colorGel?.children.some((subcategory) => subcategory.slug === categorySlug) === true
  );
}

function compareByName(a: ProductWithRelations, b: ProductWithRelations): number {
  return catalogNameCollator.compare(a.name, b.name) || a.id.localeCompare(b.id);
}

function getLeadingReferenceNumber(name: string): number | null {
  const match = name.match(/^\s*(\d+)(?=\s|$)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function isColorGelCollection(name: string): boolean {
  return COLOR_GEL_COLLECTION_PATTERN.test(name);
}

function compareColorGelProducts(
  a: ProductWithRelations,
  b: ProductWithRelations
): number {
  const aNumber = getLeadingReferenceNumber(a.name);
  const bNumber = getLeadingReferenceNumber(b.name);
  const aGroup = aNumber !== null ? 0 : isColorGelCollection(a.name) ? 2 : 1;
  const bGroup = bNumber !== null ? 0 : isColorGelCollection(b.name) ? 2 : 1;

  if (aGroup !== bGroup) return aGroup - bGroup;
  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  return compareByName(a, b);
}

export function sortStorefrontProducts(
  products: ProductWithRelations[],
  options?: { colorGel?: boolean }
): ProductWithRelations[] {
  return [...products].sort(options?.colorGel ? compareColorGelProducts : compareByName);
}
