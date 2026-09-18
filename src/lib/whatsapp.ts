import { formatCOP } from "@/lib/currency";
import type { DeliveryMethod, OrderWithItems } from "@/lib/types";

export function buildQuoteMessage(order: OrderWithItems): string {
  const lines = [
    `Hola ${order.customer_name},`,
    "",
    `Te compartimos la cotización de tu solicitud #${order.order_number}:`,
    "",
  ];

  for (const item of order.items) {
    const label = item.variant_label_snapshot
      ? `${item.product_name_snapshot} (${item.variant_label_snapshot})`
      : item.product_name_snapshot;
    lines.push(`• ${label} x${item.quantity} — ${formatCOP(item.subtotal)}`);
  }

  lines.push("", `*Total: ${formatCOP(order.total)}*`, "");
  lines.push("Si estás de acuerdo con la cotización, respóndenos por este medio para continuar.");
  return lines.join("\n");
}

export function buildOrderCrmNote(order: {
  orderNumber: number;
  source: "catalogo" | "asesor";
  customerName: string;
  customerEmail?: string | null;
  customerCedula: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address?: string | null;
  addressDetails?: string | null;
  city?: string | null;
  department?: string | null;
  locationName?: string | null;
  notes?: string | null;
  items: Array<{
    productName: string;
    variantLabel?: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
}): string {
  const lines = [
    `Solicitud #${order.orderNumber}`,
    `Origen: ${order.source === "asesor" ? "Creada por asesor" : "Catálogo web"}`,
    "Estado: Pendiente por cotizar",
    "",
    `Cliente: ${order.customerName}`,
    `Teléfono: ${order.customerPhone}`,
    `Correo: ${order.customerEmail || "No informado"}`,
    `Cédula: ${order.customerCedula}`,
    "",
    `Entrega: ${order.deliveryMethod === "domicilio" ? "Domicilio" : "Recoger en tienda"}`,
  ];

  if (order.locationName) lines.push(`Sede: ${order.locationName}`);
  if (order.address) lines.push(`Dirección: ${order.address}`);
  if (order.addressDetails) lines.push(`Detalles: ${order.addressDetails}`);
  if (order.city || order.department) {
    lines.push(`Ciudad / departamento: ${[order.city, order.department].filter(Boolean).join(", ")}`);
  }

  lines.push("", "Productos:");
  for (const item of order.items) {
    const label = item.variantLabel
      ? `${item.productName} (${item.variantLabel})`
      : item.productName;
    lines.push(`- ${label} x${item.quantity} | ${formatCOP(item.unitPrice)} | ${formatCOP(item.subtotal)}`);
  }
  lines.push("", `Subtotal: ${formatCOP(order.subtotal)}`, `Total: ${formatCOP(order.total)}`);
  if (order.notes) lines.push("", `Notas: ${order.notes}`);
  return lines.join("\n");
}
