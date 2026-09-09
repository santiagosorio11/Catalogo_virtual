import { formatCOP } from "@/lib/currency";
import type { CartItem, DeliveryMethod } from "@/lib/types";

interface OrderSummaryInput {
  orderNumber: number;
  customerName: string;
  customerCedula: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  addressDetails?: string;
  city?: string;
  department?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
}

export function buildOrderSummaryText(input: OrderSummaryInput): string {
  const lines: string[] = [];

  lines.push(`*Pedido #${input.orderNumber}*`);
  lines.push("");
  lines.push("*Datos del cliente*");
  lines.push(`Nombre: ${input.customerName}`);
  lines.push(`Cédula: ${input.customerCedula}`);
  lines.push(`Teléfono: ${input.customerPhone}`);
  lines.push("");

  if (input.deliveryMethod === "domicilio") {
    lines.push("*Entrega a domicilio*");
    lines.push(`Dirección: ${input.address ?? ""}`);
    if (input.addressDetails) lines.push(`Detalles: ${input.addressDetails}`);
    lines.push(`Ciudad: ${input.city ?? ""}`);
    lines.push(`Departamento: ${input.department ?? ""}`);
  } else {
    lines.push("*Recoger en tienda*");
  }
  lines.push("");

  lines.push("*Productos*");
  for (const item of input.items) {
    const label = item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name;
    lines.push(
      `• ${label} x${item.quantity} — ${formatCOP(item.unitPrice * item.quantity)}`
    );
  }
  lines.push("");
  lines.push(`*Total: ${formatCOP(input.subtotal)}*`);

  if (input.notes) {
    lines.push("");
    lines.push(`Notas: ${input.notes}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, text: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}
