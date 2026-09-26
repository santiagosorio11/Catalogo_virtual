import type { Category } from "@/lib/types";

export interface CategoryGroup {
  category: Category;
  children: Category[];
}

/** Keeps the database order while separating main categories from their children. */
export function groupCategories(categories: Category[]): CategoryGroup[] {
  const childrenByParent = new Map<string, Category[]>();

  for (const category of categories) {
    if (!category.parent_id) continue;
    const children = childrenByParent.get(category.parent_id) ?? [];
    children.push(category);
    childrenByParent.set(category.parent_id, children);
  }

  return categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({
      category,
      children: childrenByParent.get(category.id) ?? [],
    }));
}

/** Returns a category and every descendant, for parent-level product filters. */
export function collectCategoryAndDescendantIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const childrenByParent = new Map<string, string[]>();

  for (const category of categories) {
    if (!category.parent_id) continue;
    const children = childrenByParent.get(category.parent_id) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parent_id, children);
  }

  function collect(id: string): string[] {
    return [id, ...(childrenByParent.get(id) ?? []).flatMap(collect)];
  }

  return collect(categoryId);
}
