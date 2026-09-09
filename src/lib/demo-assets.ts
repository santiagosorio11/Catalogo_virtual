import type { CategoryWithChildren, ProductWithRelations, StoreSettings } from "@/lib/types";

const DEMO_ASSET_ROOT = "/demo/organic-nails";

const CATEGORY_IMAGES: Record<string, string> = {
  "color-gel": `${DEMO_ASSET_ROOT}/category-color-gel.jpeg`,
  "bases-top-y-tratamientos": `${DEMO_ASSET_ROOT}/category-bases.webp`,
  "spa-mara": `${DEMO_ASSET_ROOT}/category-spa.jpg`,
  "press-on": `${DEMO_ASSET_ROOT}/category-press-on.jpg`,
  "lamparas-y-pulidoras": `${DEMO_ASSET_ROOT}/category-lamps.png`,
  "tech-gel": `${DEMO_ASSET_ROOT}/category-tech-gel.jpeg`,
};

const PRODUCT_IMAGES: Record<string, string> = {
  "020-midnight-blue": `${DEMO_ASSET_ROOT}/020-midnight-blue.jpg`,
  "028-classic-moka-028": `${DEMO_ASSET_ROOT}/028-classic-moka.jpg`,
  "031-classic-taupe": `${DEMO_ASSET_ROOT}/031-classic-taupe.jpg`,
  "055-iron-purple": `${DEMO_ASSET_ROOT}/055-iron-purple.png`,
  "092-love-kiss": `${DEMO_ASSET_ROOT}/092-love-kiss.jpg`,
  "150-pastel-aqua": `${DEMO_ASSET_ROOT}/150-pastel-aqua.jpg`,
  "010-ice-blue": `${DEMO_ASSET_ROOT}/010-ice-blue.jpg`,
  "011-ice-purple": `${DEMO_ASSET_ROOT}/011-ice-purple.jpg`,
  "012-ice-lilac": `${DEMO_ASSET_ROOT}/012-ice-lilac.jpg`,
  "013-ice-mint": `${DEMO_ASSET_ROOT}/013-ice-mint.jpg`,
  "014-ice-pink": `${DEMO_ASSET_ROOT}/014-ice-pink.jpg`,
  "015-ice-daisy": `${DEMO_ASSET_ROOT}/015-ice-daisy.jpg`,
};

const ORGANIC_DESCRIPTION =
  "Centro de Capacitación y Ventas Organic Nails en Bogotá. Castellana · Quirigua · Venecia · Kennedy · 20 de Julio · Soacha";

export function withDemoStoreAssets(settings: StoreSettings): StoreSettings {
  const isUnconfigured = settings.store_name.trim().toLowerCase() === "mi tienda";

  return {
    ...settings,
    store_name: isUnconfigured ? "Organic Nails Bogotá" : settings.store_name,
    logo_url: settings.logo_url ?? `${DEMO_ASSET_ROOT}/logo.jpeg`,
    banner_url: settings.banner_url ?? `${DEMO_ASSET_ROOT}/banner.png`,
    description: settings.description ?? ORGANIC_DESCRIPTION,
    whatsapp_number: settings.whatsapp_number ?? "573118109250",
  };
}

export function withDemoCategoryAssets(
  categories: CategoryWithChildren[]
): CategoryWithChildren[] {
  return categories.map((category) => ({
    ...category,
    image_url: category.image_url ?? CATEGORY_IMAGES[category.slug] ?? null,
    children: category.children.map((child) => ({
      ...child,
      image_url: child.image_url ?? CATEGORY_IMAGES[child.slug] ?? null,
    })),
  }));
}

export function withDemoProductAssets(
  products: ProductWithRelations[]
): ProductWithRelations[] {
  return products.map((product) => {
    const imageUrl = PRODUCT_IMAGES[product.slug];
    if (product.images.length > 0 || !imageUrl) return product;

    return {
      ...product,
      images: [
        {
          id: `demo-${product.id}`,
          product_id: product.id,
          url: imageUrl,
          sort_order: 0,
        },
      ],
    };
  });
}
