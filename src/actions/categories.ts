"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { uploadImageAsset } from "@/lib/media";

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const supabase = await createClient();
  let slug = slugify(base) || "categoria";
  let attempt = 0;

  while (true) {
    const query = supabase.from("categories").select("id").eq("slug", slug);
    const { data } = excludeId ? await query.neq("id", excludeId) : await query;
    if (!data || data.length === 0) return slug;
    attempt += 1;
    slug = `${slugify(base)}-${attempt + 1}`;
  }
}

export async function createCategory(input: {
  name: string;
  parentId: string | null;
  imageUrl?: string | null;
}) {
  const supabase = await createClient();

  const siblingsQuery = supabase
    .from("categories")
    .select("id", { count: "exact", head: true });
  const { count } = input.parentId
    ? await siblingsQuery.eq("parent_id", input.parentId)
    : await siblingsQuery.is("parent_id", null);

  const slug = await uniqueSlug(input.name);

  const { error } = await supabase.from("categories").insert({
    name: input.name.trim(),
    slug,
    parent_id: input.parentId,
    image_url: input.imageUrl ?? null,
    sort_order: count ?? 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(
  id: string,
  input: { name: string; imageUrl?: string | null }
) {
  const supabase = await createClient();
  const slug = await uniqueSlug(input.name, id);
  const { error } = await supabase
    .from("categories")
    .update({ name: input.name.trim(), slug, image_url: input.imageUrl ?? null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { data, error: readError } = await supabase.from("categories").select("id, parent_id");
  if (readError) return { error: readError.message };

  const childrenByParent = new Map<string, string[]>();
  for (const category of data ?? []) {
    if (!category.parent_id) continue;
    const children = childrenByParent.get(category.parent_id) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parent_id, children);
  }

  function collectDepthFirst(categoryId: string): string[] {
    const descendants = (childrenByParent.get(categoryId) ?? []).flatMap(collectDepthFirst);
    return [...descendants, categoryId];
  }

  for (const categoryId of collectDepthFirst(id)) {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
  return { success: true };
}

export async function uploadCategoryImage(categoryId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió el archivo." };

  const result = await uploadImageAsset("categories", file, "category", categoryId);
  if ("error" in result) return result;

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("categories")
    .update({ image_url: result.url })
    .eq("id", categoryId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
  return { success: true, url: result.url };
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", id)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
  return { success: true };
}
