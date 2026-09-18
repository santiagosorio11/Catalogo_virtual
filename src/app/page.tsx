import { getCategoryTree, getProducts, getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { CategoryChips } from "@/components/storefront/CategoryChips";
import { ProductGrid } from "@/components/storefront/ProductGrid";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [settings, topLevelCategories] = await Promise.all([
    getStoreSettings(),
    getCategoryTree(),
  ]);

  const requestedCategory = categoria ?? topLevelCategories[0]?.slug;
  const categoryFilter = requestedCategory === "todo" ? undefined : requestedCategory;
  const products = await getProducts({ categorySlug: categoryFilter });

  return (
    <div className="storefront-shell min-h-screen bg-[#f4f8fb]">
      <Header
        storeName={settings.store_name}
        logoUrl={settings.logo_url}
        bannerUrl={settings.banner_url}
        description={settings.description}
        whatsappNumber={settings.whatsapp_number}
      />

      <main className="mx-auto w-full max-w-7xl px-3 pb-32 pt-5 sm:px-5 sm:pt-7">
        <CategoryChips
          categories={topLevelCategories}
          activeSlug={requestedCategory}
          logoUrl={settings.logo_url}
        />

        <section className="mt-6" aria-labelledby="products-heading">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Catálogo
              </p>
              <h2
                id="products-heading"
                className="mt-1 text-xl font-bold text-orbita-navy sm:text-2xl"
              >
                Productos para ti
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {products.length} {products.length === 1 ? "producto" : "productos"}
            </span>
          </div>
          <ProductGrid products={products} />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-7 text-center text-xs text-slate-500">
        {settings.store_name} · Catálogo impulsado por Órbita IA
      </footer>
    </div>
  );
}
