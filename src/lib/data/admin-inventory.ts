import { createClient } from "@/lib/supabase/server";
import type { ProductVariant } from "@/lib/types";

const PAGE_SIZE = 50;

export interface InventoryRow {
  productId: string;
  productName: string;
  thumbnailUrl: string | null;
  variant: ProductVariant | null;
  stockQuantity: number | null;
}

export async function getInventoryRows(options: { search?: string; page?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select("id, name, stock_quantity", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (options.search) query = query.ilike("name", `%${options.search}%`);

  const { data: products, count } = await query;
  const ids = (products ?? []).map((p) => p.id);

  const [{ data: variants }, { data: images }] = await Promise.all([
    ids.length > 0
      ? supabase.from("product_variants").select("*").in("product_id", ids).order("sort_order")
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? supabase
          .from("product_images")
          .select("product_id, url, sort_order")
          .in("product_id", ids)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const thumbnailByProduct = new Map<string, string>();
  for (const img of images ?? []) {
    if (!thumbnailByProduct.has(img.product_id)) thumbnailByProduct.set(img.product_id, img.url);
  }

  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const v of (variants ?? []) as ProductVariant[]) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    variantsByProduct.get(v.product_id)!.push(v);
  }

  const rows: InventoryRow[] = [];
  for (const product of products ?? []) {
    const productVariants = variantsByProduct.get(product.id) ?? [];
    if (productVariants.length === 0) {
      rows.push({
        productId: product.id,
        productName: product.name,
        thumbnailUrl: thumbnailByProduct.get(product.id) ?? null,
        variant: null,
        stockQuantity: product.stock_quantity,
      });
    } else {
      for (const variant of productVariants) {
        rows.push({
          productId: product.id,
          productName: product.name,
          thumbnailUrl: thumbnailByProduct.get(product.id) ?? null,
          variant,
          stockQuantity: variant.stock_quantity,
        });
      }
    }
  }

  const total = count ?? 0;
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
