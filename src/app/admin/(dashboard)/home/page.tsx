import { getStoreSettings } from "@/lib/data/queries";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { HomeSettingsForm } from "@/components/admin/HomeSettingsForm";

export default async function AdminHomeSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <AdminTopbar title="Home de tu tienda" />
      <div className="admin-enter p-4 sm:p-6">
        <HomeSettingsForm settings={settings} />
      </div>
    </>
  );
}
