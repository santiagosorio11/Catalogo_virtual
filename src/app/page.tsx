import Image from "next/image";
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

  const [settings, categoryTree, products] = await Promise.all([
    getStoreSettings(),
    getCategoryTree(),
    getProducts({ categorySlug: categoria }),
  ]);

  const topLevelCategories = categoryTree;

  return (
    <>
      <Header storeName={settings.store_name} logoUrl={settings.logo_url} />

      {settings.banner_url && (
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          <Image
            src={settings.banner_url}
            alt={settings.store_name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        {settings.description && (
          <p className="mb-4 text-sm text-black/60">{settings.description}</p>
        )}

        <div className="mb-5">
          <CategoryChips categories={topLevelCategories} activeSlug={categoria} />
        </div>

        <ProductGrid products={products} />
      </main>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-black/40">
        {settings.store_name}
      </footer>
    </>
  );
}
