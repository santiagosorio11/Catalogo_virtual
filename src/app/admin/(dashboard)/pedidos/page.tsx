import { getAdminOrders } from "@/lib/data/admin-orders";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { OrdersTable } from "@/components/admin/OrdersTable";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: OrderStatus; pago?: PaymentStatus; page?: string }>;
}) {
  const params = await searchParams;
  const { orders, total, page, totalPages } = await getAdminOrders({
    search: params.search,
    status: params.estado,
    paymentStatus: params.pago,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <AdminTopbar title="Pedidos" />
      <div className="admin-enter p-4 sm:p-6">
        <OrdersTable orders={orders} total={total} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
