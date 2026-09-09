import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/lib/types";

const PAGE_SIZE = 50;

export async function getAdminOrders(options: {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.status) query = query.eq("status", options.status);
  if (options.paymentStatus) query = query.eq("payment_status", options.paymentStatus);
  if (options.search) {
    const search = options.search.trim();
    const asNumber = Number(search);
    if (!Number.isNaN(asNumber) && search !== "") {
      query = query.or(
        `order_number.eq.${asNumber},customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
      );
    } else {
      query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
  }

  const { data, count } = await query;
  const total = count ?? 0;
  return {
    orders: (data ?? []) as Order[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminOrderById(id: string) {
  const supabase = await createClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) return null;
  return { ...(order as Order), items: (items ?? []) as OrderItem[] };
}
