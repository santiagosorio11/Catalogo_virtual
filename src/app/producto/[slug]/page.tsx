import { notFound } from "next/navigation";
import { getProductBySlug, getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { ProductDetail } from "@/components/storefront/ProductDetail";
import { withDemoProductAssets, withDemoStoreAssets } from "@/lib/demo-assets";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, rawSettings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);

  if (!product) notFound();
  const settings = withDemoStoreAssets(rawSettings);
  const hydratedProduct = withDemoProductAssets([product])[0];

  return (
    <div className="storefront-shell min-h-screen bg-[#f4f8fb]">
      <Header
        storeName={settings.store_name}
        logoUrl={settings.logo_url}
        bannerUrl={settings.banner_url}
        description={settings.description}
        whatsappNumber={settings.whatsapp_number}
        compact
      />
      <ProductDetail product={hydratedProduct} />
    </div>
  );
}
