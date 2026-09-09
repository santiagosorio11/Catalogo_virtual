"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategory, reorderCategories } from "@/actions/categories";
import { CategoryFormModal } from "./CategoryFormModal";
import type { CategoryWithChildren, Category } from "@/lib/types";

function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
  onOpenSubcategories,
}: {
  category: CategoryWithChildren;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onOpenSubcategories: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-2xl border border-black/5 bg-white p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs font-medium">
          {index + 1}
        </span>
        <button {...attributes} {...listeners} className="cursor-grab text-black/30 hover:text-black">
          <GripVertical size={18} />
        </button>
      </div>

      <div className="relative mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full bg-black/5">
        {category.image_url ? (
          <Image src={category.image_url} alt={category.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-black/20">
            {category.name.charAt(0)}
          </div>
        )}
      </div>

      <p className="text-center text-sm font-medium text-[var(--foreground)]">{category.name}</p>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button onClick={onEdit} className="text-black/40 hover:text-brand" aria-label="Editar">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="text-black/40 hover:text-red-500" aria-label="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>

      <button
        onClick={onOpenSubcategories}
        className="mt-3 w-full rounded-lg bg-black/5 py-1.5 text-xs font-medium text-black/60 hover:bg-black/10"
      >
        Subcategorías ({category.children.length})
      </button>
    </div>
  );
}

export function CategoriesManager({ initial }: { initial: CategoryWithChildren[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [modal, setModal] = useState<{ parentId: string | null; category: Category | null } | null>(
    null
  );
  const [expanded, setExpanded] = useState<CategoryWithChildren | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    reorderCategories(reordered.map((c) => c.id));
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría? También se eliminarán sus subcategorías.")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await deleteCategory(id);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setModal({ parentId: null, category: null })}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <Plus size={16} /> Crear una nueva categoría
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                onEdit={() => setModal({ parentId: null, category })}
                onDelete={() => handleDelete(category.id)}
                onOpenSubcategories={() => setExpanded(category)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {expanded && (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Subcategorías de {expanded.name}</h2>
            <button
              onClick={() => setModal({ parentId: expanded.id, category: null })}
              className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {expanded.children.length === 0 ? (
            <p className="text-sm text-black/40">Sin subcategorías todavía.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {expanded.children.map((child) => (
                <li key={child.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{child.name}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModal({ parentId: expanded.id, category: child })}
                      className="text-black/40 hover:text-brand"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      className="text-black/40 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modal && (
        <CategoryFormModal
          parentId={modal.parentId}
          category={modal.category}
          onClose={() => {
            setModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
