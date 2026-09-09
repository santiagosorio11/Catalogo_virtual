import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/data/admin-orders";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { OrderDetail } from "@/components/admin/OrderDetail";

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  return (
    <>
      <AdminTopbar title={`Pedido #${order.order_number}`} />
      <div className="admin-enter p-4 sm:p-6">
        <OrderDetail order={order} />
      </div>
    </>
  );
}
