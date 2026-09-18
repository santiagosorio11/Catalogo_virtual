import { notFound } from "next/navigation";
import { getProductBySlug, getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { ProductDetail } from "@/components/storefront/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);

  if (!product) notFound();

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
      <ProductDetail product={product} />
    </div>
  );
}
