import { getInventoryRows } from "@/lib/data/admin-inventory";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InventoryTable } from "@/components/admin/InventoryTable";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { rows, total, page, totalPages } = await getInventoryRows({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <AdminTopbar title="Inventario" />
      <div className="admin-enter p-4 sm:p-6">
        <InventoryTable rows={rows} total={total} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
