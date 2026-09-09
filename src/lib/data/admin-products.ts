import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

const PAGE_SIZE = 50;

export interface AdminProductRow extends Product {
  categoryNames: string[];
  thumbnailUrl: string | null;
}

export async function getAdminProducts(options: {
  search?: string;
  categoryId?: string;
  active?: "true" | "false";
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let productIdsFilter: string[] | null = null;
  if (options.categoryId) {
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", options.categoryId);
    productIdsFilter = (links ?? []).map((l) => l.product_id);
    if (productIdsFilter.length === 0) {
      return { products: [] as AdminProductRow[], total: 0, page, totalPages: 1 };
    }
  }

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.search) query = query.ilike("name", `%${options.search}%`);
  if (options.active) query = query.eq("active", options.active === "true");
  if (productIdsFilter) query = query.in("id", productIdsFilter);

  const { data: products, count } = await query;
  const ids = (products ?? []).map((p) => p.id);

  const [{ data: catLinks }, { data: allCategories }, { data: images }] = await Promise.all([
    ids.length > 0
      ? supabase.from("product_categories").select("*").in("product_id", ids)
      : Promise.resolve({ data: [] }),
    supabase.from("categories").select("*"),
    ids.length > 0
      ? supabase
          .from("product_images")
          .select("product_id, url, sort_order")
          .in("product_id", ids)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const categoryById = new Map<string, Category>(
    ((allCategories ?? []) as Category[]).map((c) => [c.id, c])
  );

  const thumbnailByProduct = new Map<string, string>();
  for (const img of images ?? []) {
    if (!thumbnailByProduct.has(img.product_id)) thumbnailByProduct.set(img.product_id, img.url);
  }

  const rows: AdminProductRow[] = (products ?? []).map((product) => ({
    ...(product as Product),
    categoryNames: (catLinks ?? [])
      .filter((l) => l.product_id === product.id)
      .map((l) => categoryById.get(l.category_id)?.name)
      .filter((n): n is string => Boolean(n)),
    thumbnailUrl: thumbnailByProduct.get(product.id) ?? null,
  }));

  const total = count ?? 0;
  return { products: rows, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
