import { createClient } from "@/lib/supabase/server";
import { collectCategoryAndDescendantIds } from "@/lib/categories";
import { normalizeCatalogName } from "@/lib/catalog-name";
import { sortCatalogProducts } from "@/lib/storefront-catalog";
import type { Category, Product } from "@/lib/types";

const PAGE_SIZE = 50;
const PRODUCT_QUERY_BATCH_SIZE = 1000;

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
  let useColorGelOrder = false;
  if (options.categoryId) {
    const { data: categoryData } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    const categories = (categoryData ?? []) as Category[];
    const selectedCategory = categories.find((category) => category.id === options.categoryId);
    const categoryIds = selectedCategory
      ? collectCategoryAndDescendantIds(selectedCategory.id, categories)
      : [options.categoryId];
    const colorGelCategory = categories.find((category) => category.slug === "color-gel");
    const colorGelCategoryIds = colorGelCategory
      ? collectCategoryAndDescendantIds(colorGelCategory.id, categories)
      : [];
    useColorGelOrder = Boolean(
      selectedCategory && colorGelCategoryIds.includes(selectedCategory.id)
    );
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", categoryIds);
    productIdsFilter = [...new Set((links ?? []).map((link) => link.product_id))];
    if (productIdsFilter.length === 0) {
      return { products: [] as AdminProductRow[], total: 0, page, totalPages: 1 };
    }
  }

  function buildProductQuery(batchFrom: number, batchTo: number) {
    let query = supabase
      .from("products")
      .select("*", { count: "exact" });

    if (options.search) query = query.ilike("name", `%${options.search}%`);
    if (options.active) query = query.eq("active", options.active === "true");
    if (productIdsFilter) query = query.in("id", productIdsFilter);

    return query.order("id", { ascending: true }).range(batchFrom, batchTo);
  }

  const matchingProducts: Product[] = [];
  let total: number | null = null;

  for (
    let batchFrom = 0;
    total === null || batchFrom < total;
    batchFrom += PRODUCT_QUERY_BATCH_SIZE
  ) {
    const { data, count, error } = await buildProductQuery(
      batchFrom,
      batchFrom + PRODUCT_QUERY_BATCH_SIZE - 1
    );
    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);

    const batch = (data ?? []) as Product[];
    matchingProducts.push(...batch);
    if (total === null) total = count ?? batch.length;
    if (batch.length < PRODUCT_QUERY_BATCH_SIZE) break;
  }

  const sortedProducts = sortCatalogProducts(
    matchingProducts.map((product) => ({
      ...product,
      name: normalizeCatalogName(product.name),
    })),
    { colorGel: useColorGelOrder }
  );
  const products = sortedProducts.slice(from, to + 1);
  const ids = products.map((product) => product.id);

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
    ((allCategories ?? []) as Category[]).map((category) => [
      category.id,
      { ...category, name: normalizeCatalogName(category.name) },
    ])
  );

  const thumbnailByProduct = new Map<string, string>();
  for (const img of images ?? []) {
    if (!thumbnailByProduct.has(img.product_id)) thumbnailByProduct.set(img.product_id, img.url);
  }

  const rows: AdminProductRow[] = (products ?? []).map((product) => ({
    ...product,
    categoryNames: (catLinks ?? [])
      .filter((l) => l.product_id === product.id)
      .map((l) => categoryById.get(l.category_id)?.name)
      .filter((n): n is string => Boolean(n)),
    thumbnailUrl: thumbnailByProduct.get(product.id) ?? null,
  }));

  const productCount = total ?? 0;
  return {
    products: rows,
    total: productCount,
    page,
    totalPages: Math.max(1, Math.ceil(productCount / PAGE_SIZE)),
  };
}
