import { getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { withDemoStoreAssets } from "@/lib/demo-assets";

export default async function CheckoutPage() {
  const settings = withDemoStoreAssets(await getStoreSettings());

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
      <CheckoutForm whatsappNumber={settings.whatsapp_number} />
    </div>
  );
}
