import { notFound } from "next/navigation";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CategoryDetailManager } from "@/components/admin/CategoryDetailManager";
import { getAllCategoriesFlat } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getAllCategoriesFlat();
  const category = categories.find((item) => item.id === id && item.parent_id === null);

  if (!category) notFound();

  const subcategories = categories
    .filter((item) => item.parent_id === category.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const supabase = await createClient();
  const { count: directProductCount } = await supabase
    .from("product_categories")
    .select("product_id", { count: "exact", head: true })
    .eq("category_id", category.id);

  return (
    <>
      <AdminTopbar title={category.name} backHref="/admin/categorias" />
      <div className="admin-enter p-4 sm:p-6">
        <CategoryDetailManager
          key={`${category.id}:${category.name}:${category.image_url}:${subcategories
            .map((item) => `${item.id}:${item.name}:${item.image_url}:${item.sort_order}`)
            .join("|")}`}
          category={category}
          initialSubcategories={subcategories}
          directProductCount={directProductCount ?? 0}
        />
      </div>
    </>
  );
}
