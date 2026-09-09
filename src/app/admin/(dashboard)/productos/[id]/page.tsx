import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCategoriesFlat } from "@/lib/data/queries";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ProductEditor } from "@/components/admin/ProductEditor";
import type { Category, Product, ProductImage, ProductVariant } from "@/lib/types";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: images }, { data: variants }, { data: catLinks }, categories] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_categories").select("category_id").eq("product_id", id),
      getAllCategoriesFlat(),
    ]);

  if (!product) notFound();

  const categoryById = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const productCategories = (catLinks ?? [])
    .map((l) => categoryById.get(l.category_id))
    .filter((c): c is Category => Boolean(c));

  const fullProduct = {
    ...(product as Product),
    images: (images ?? []) as ProductImage[],
    variants: (variants ?? []) as ProductVariant[],
    categories: productCategories,
  };

  return (
    <>
      <AdminTopbar title={product.name} />
      <div className="admin-enter p-4 sm:p-6">
        <ProductEditor product={fullProduct} categories={categories} />
      </div>
    </>
  );
}
