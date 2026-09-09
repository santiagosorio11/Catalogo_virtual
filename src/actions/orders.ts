"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem, DeliveryMethod, OrderStatus, PaymentStatus } from "@/lib/types";

export interface CreateOrderInput {
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
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: number;
  subtotal: number;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult | { error: string }> {
  if (!input.customerName.trim()) return { error: "El nombre es obligatorio." };
  if (!input.customerCedula.trim()) return { error: "La cédula es obligatoria." };
  if (!input.customerPhone.trim()) return { error: "El teléfono es obligatorio." };
  if (input.items.length === 0) return { error: "El carrito está vacío." };
  if (input.deliveryMethod === "domicilio" && !input.address?.trim()) {
    return { error: "La dirección es obligatoria para domicilio." };
  }

  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const supabase = await createClient();

  const itemsPayload = input.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId,
    product_name_snapshot: item.name,
    variant_label_snapshot: item.variantLabel,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.unitPrice * item.quantity,
  }));

  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_customer_name: input.customerName.trim(),
    p_customer_cedula: input.customerCedula.trim(),
    p_customer_phone: input.customerPhone.trim(),
    p_delivery_method: input.deliveryMethod,
    p_address: input.address?.trim() || null,
    p_address_details: input.addressDetails?.trim() || null,
    p_city: input.city?.trim() || null,
    p_department: input.department?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_subtotal: subtotal,
    p_total: subtotal,
    p_items: itemsPayload,
  });

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "No se pudo crear el pedido." };
  }

  const order = data[0];
  return { orderId: order.id, orderNumber: order.order_number, subtotal };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("id", orderId);
  if (error) return { error: error.message };
  return { success: true };
}
