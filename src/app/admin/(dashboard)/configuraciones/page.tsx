import { getStoreSettings } from "@/lib/data/queries";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { GeneralSettingsForm } from "@/components/admin/GeneralSettingsForm";

export default async function ConfiguracionesPage() {
  const settings = await getStoreSettings();

  return (
    <>
      <AdminTopbar title="Configuraciones" />
      <div className="admin-enter p-4 sm:p-6">
        <GeneralSettingsForm settings={settings} />
      </div>
    </>
  );
}
