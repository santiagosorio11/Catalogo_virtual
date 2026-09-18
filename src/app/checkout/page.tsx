import { getActiveStoreLocations, getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";

export default async function CheckoutPage() {
  const [settings, locations] = await Promise.all([
    getStoreSettings(),
    getActiveStoreLocations(),
  ]);

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
      <CheckoutForm locations={locations} />
    </div>
  );
}
