import { getStoreSettings } from "@/lib/data/queries";
import { Header } from "@/components/storefront/Header";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <Header storeName={settings.store_name} logoUrl={settings.logo_url} />
      <CheckoutForm whatsappNumber={settings.whatsapp_number} />
    </>
  );
}
