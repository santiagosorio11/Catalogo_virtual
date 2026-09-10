"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem, DeliveryMethod, OrderStatus, PaymentStatus } from "@/lib/types";

export interface CreateOrderInput {
  customerName: string;
  customerCedula: string;
  customerPhone: string;
  locationId?: string;
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
  locationName: string | null;
  locationAddress: string | null;
  whatsappNumber: string | null;
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

  const rpcInput = {
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
    p_location_id: input.locationId || null,
    p_items: itemsPayload,
  };

  let { data, error } = await supabase.rpc("create_order_with_items", rpcInput);
  let usedLegacyRpc = false;

  // Keeps checkout operational while migration 0005 is being deployed. Once
  // the new RPC exists, Supabase returns the destination WhatsApp atomically.
  if (
    error &&
    (error.code === "PGRST202" || error.message.includes("Could not find the function"))
  ) {
    const legacyInput: Partial<typeof rpcInput> = { ...rpcInput };
    delete legacyInput.p_location_id;
    const legacyResult = await supabase.rpc("create_order_with_items", legacyInput);
    data = legacyResult.data;
    error = legacyResult.error;
    usedLegacyRpc = true;
  }

  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "No se pudo crear el pedido." };
  }

  const order = data[0];
  let fallbackWhatsApp: string | null = null;
  if (usedLegacyRpc || !order.whatsapp_number) {
    const { data: settings } = await supabase
      .from("store_settings")
      .select("whatsapp_number")
      .eq("id", true)
      .maybeSingle();
    fallbackWhatsApp = settings?.whatsapp_number ?? null;
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    subtotal,
    locationName: order.location_name ?? null,
    locationAddress: order.location_address ?? null,
    whatsappNumber: order.whatsapp_number ?? fallbackWhatsApp,
  };
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
