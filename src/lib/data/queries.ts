import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  CategoryWithChildren,
  Product,
  ProductWithRelations,
  StoreLocation,
  StoreSettings,
} from "@/lib/types";

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").single();
  return (
    data ?? {
      id: true,
      store_name: "Mi Tienda",
      logo_url: null,
      banner_url: null,
      description: null,
      whatsapp_number: null,
      currency: "COP",
      updated_at: new Date().toISOString(),
    }
  );
}

export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const categories = (data ?? []) as Category[];
  const byParent = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }

  const roots = byParent.get(null) ?? [];
  return roots.map((root) => ({
    ...root,
    children: byParent.get(root.id) ?? [],
  }));
}

export async function getAllCategoriesFlat(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Category[];
}

export async function getActiveStoreLocations(): Promise<StoreLocation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_locations")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as StoreLocation[];
}

export async function getAllStoreLocations(): Promise<StoreLocation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_locations")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as StoreLocation[];
}

/** Returns the category id itself plus all descendant category ids. */
function collectDescendantIds(rootId: string, all: Category[]): string[] {
  const result = [rootId];
  const children = all.filter((c) => c.parent_id === rootId);
  for (const child of children) {
    result.push(...collectDescendantIds(child.id, all));
  }
  return result;
}

export async function getProducts(options?: {
  categorySlug?: string;
  search?: string;
  onlyActive?: boolean;
}): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  let productIdsFilter: string[] | null = null;

  if (options?.categorySlug) {
    const allCategories = await getAllCategoriesFlat();
    const category = allCategories.find((c) => c.slug === options.categorySlug);
    if (!category) return [];
    const categoryIds = collectDescendantIds(category.id, allCategories);
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", categoryIds);
    productIdsFilter = (links ?? []).map((l) => l.product_id);
    if (productIdsFilter.length === 0) return [];
  }

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (options?.onlyActive !== false) {
    query = query.eq("active", true);
  }
  if (productIdsFilter) {
    query = query.in("id", productIdsFilter);
  }
  if (options?.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  const { data: products } = await query;
  if (!products || products.length === 0) return [];

  return attachRelations(products as Product[]);
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!product) return null;
  const [withRelations] = await attachRelations([product as Product]);
  return withRelations ?? null;
}

async function attachRelations(products: Product[]): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const ids = products.map((p) => p.id);

  const [{ data: images }, { data: variants }, { data: catLinks }, { data: allCategories }] =
    await Promise.all([
      supabase.from("product_images").select("*").in("product_id", ids).order("sort_order"),
      supabase.from("product_variants").select("*").in("product_id", ids).order("sort_order"),
      supabase.from("product_categories").select("*").in("product_id", ids),
      supabase.from("categories").select("*"),
    ]);

  const categoryById = new Map<string, Category>(
    ((allCategories ?? []) as Category[]).map((c) => [c.id, c])
  );

  return products.map((product) => ({
    ...product,
    images: (images ?? []).filter((i) => i.product_id === product.id),
    variants: (variants ?? []).filter((v) => v.product_id === product.id),
    categories: (catLinks ?? [])
      .filter((l) => l.product_id === product.id)
      .map((l) => categoryById.get(l.category_id))
      .filter((c): c is Category => Boolean(c)),
  }));
}
