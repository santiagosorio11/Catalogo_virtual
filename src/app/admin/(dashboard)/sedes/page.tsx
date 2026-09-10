import Link from "next/link";
import { Settings2 } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { LocationsManager } from "@/components/admin/LocationsManager";
import { getAllStoreLocations } from "@/lib/data/queries";

export default async function SedesPage() {
  const locations = await getAllStoreLocations();

  return (
    <>
      <AdminTopbar
        title="Sedes"
        actions={
          <Link
            href="/admin/configuraciones"
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex"
          >
            <Settings2 size={16} aria-hidden="true" />
            WhatsApp general
          </Link>
        }
      />
      <div className="admin-enter p-4 sm:p-6">
        <LocationsManager key={JSON.stringify(locations)} initial={locations} />
      </div>
    </>
  );
}
