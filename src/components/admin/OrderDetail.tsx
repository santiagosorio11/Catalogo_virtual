"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCOP } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { updateOrderStatus, updatePaymentStatus } from "@/actions/orders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types";
import { StatusBadge, PaymentBadge } from "./OrdersTable";
import type { OrderStatus, OrderWithItems, PaymentStatus } from "@/lib/types";

export function OrderDetail({ order }: { order: OrderWithItems }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status);

  async function handleStatusChange(next: OrderStatus) {
    setStatus(next);
    await updateOrderStatus(order.id, next);
    router.refresh();
  }

  async function handlePaymentChange(next: PaymentStatus) {
    setPaymentStatus(next);
    await updatePaymentStatus(order.id, next);
    router.refresh();
  }

  function handleSendPaymentLink() {
    const text = `Hola ${order.customer_name}, te compartimos el resumen de tu pedido #${order.order_number} por un total de ${formatCOP(order.total)}. Quedamos atentos para coordinar el pago.`;
    window.open(buildWhatsAppLink(order.customer_phone, text), "_blank");
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-semibold">Pedido #{order.order_number}</h1>
        <StatusBadge status={status} />
        <PaymentBadge status={paymentStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black/60">Estado del pedido</h2>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="rounded-lg border border-black/10 px-3 py-2.5 text-sm"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black/60">Información de pago</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={paymentStatus}
                onChange={(e) => handlePaymentChange(e.target.value as PaymentStatus)}
                className="rounded-lg border border-black/10 px-3 py-2.5 text-sm"
              >
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSendPaymentLink}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Enviar por WhatsApp
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black/60">Detalles del pedido</h2>
            <p className="mb-3 text-xs text-black/40">
              {new Date(order.created_at).toLocaleString("es-CO")}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase text-black/40">
                  <th className="py-2">Producto</th>
                  <th className="py-2">Cantidad</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-black/5 last:border-0">
                    <td className="py-2.5">
                      {item.product_name_snapshot}
                      {item.variant_label_snapshot && (
                        <span className="text-black/40"> ({item.variant_label_snapshot})</span>
                      )}
                    </td>
                    <td className="py-2.5">{item.quantity}</td>
                    <td className="py-2.5">{formatCOP(item.unit_price)}</td>
                    <td className="py-2.5 font-medium">{formatCOP(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end border-t border-black/10 pt-3 text-sm">
              <div className="w-40 space-y-1">
                <div className="flex justify-between">
                  <span className="text-black/50">Subtotal</span>
                  <span>{formatCOP(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCOP(order.total)}</span>
                </div>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="rounded-2xl border border-black/5 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold text-black/60">Notas del pedido</h2>
              <p className="text-sm text-black/70">{order.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black/60">Comprador</h2>
            <p className="text-sm font-medium">{order.customer_name}</p>
            <p className="mt-1 text-sm text-black/50">Teléfono: {order.customer_phone}</p>
            <p className="text-sm text-black/50">Cédula: {order.customer_cedula}</p>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black/60">Entrega</h2>
            {order.location_name_snapshot && (
              <div className="mb-3 rounded-xl bg-orbita-cyan-soft px-3 py-2.5 text-sm text-orbita-navy">
                <p className="font-semibold">Sede {order.location_name_snapshot}</p>
                {order.location_address_snapshot && (
                  <p className="mt-0.5 text-xs text-slate-500">{order.location_address_snapshot}</p>
                )}
                {order.location_whatsapp_snapshot && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    WhatsApp: +{order.location_whatsapp_snapshot}
                  </p>
                )}
              </div>
            )}
            {order.delivery_method === "domicilio" ? (
              <div className="space-y-1 text-sm text-black/70">
                <p className="font-medium text-[var(--foreground)]">Domicilio</p>
                <p>{order.address}</p>
                {order.address_details && <p>{order.address_details}</p>}
                <p>
                  {order.city}
                  {order.department ? `, ${order.department}` : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium text-[var(--foreground)]">Recoger en tienda</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
