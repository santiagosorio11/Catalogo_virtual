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
    <>
      <Header storeName={settings.store_name} logoUrl={settings.logo_url} />
      <ProductDetail product={product} />
    </>
  );
}
