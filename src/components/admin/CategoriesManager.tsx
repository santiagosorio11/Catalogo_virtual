"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { ArrowRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategory, reorderCategories } from "@/actions/categories";
import { useToast } from "@/components/ui/Toast";
import { CategoryFormModal } from "./CategoryFormModal";
import type { CategoryWithChildren, Category } from "@/lib/types";

function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
}: {
  category: CategoryWithChildren;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orbita-cyan/60 hover:shadow-[0_18px_45px_-34px_rgba(3,27,45,0.55)]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-xs font-medium">
          {index + 1}
        </span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Mover ${category.name}`}
          className="cursor-grab rounded-lg p-1 text-black/30 hover:bg-slate-50 hover:text-black"
        >
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
        <button type="button" onClick={onEdit} className="text-black/40 hover:text-brand" aria-label={`Editar ${category.name}`}>
          <Pencil size={16} />
        </button>
        <button type="button" onClick={onDelete} className="text-black/40 hover:text-red-500" aria-label={`Eliminar ${category.name}`}>
          <Trash2 size={16} />
        </button>
      </div>

      <Link
        href={`/admin/categorias/${category.id}`}
        className="mt-3 flex min-h-10 w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-orbita-cyan-soft hover:text-orbita-navy"
      >
        <span>Configurar · {category.children.length} subcategorías</span>
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function CategoriesManager({ initial }: { initial: CategoryWithChildren[] }) {
  const router = useRouter();
  const toast = useToast();
  const [categories, setCategories] = useState(initial);
  const [modal, setModal] = useState<{ parentId: string | null; category: Category | null } | null>(
    null
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previous = categories;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    const result = await reorderCategories(reordered.map((c) => c.id));
    if ("error" in result) {
      setCategories(previous);
      toast.error("No se pudo guardar el nuevo orden", { description: result.error });
      return;
    }
    toast.success("Orden de categorías actualizado");
  }

  async function handleDelete(category: CategoryWithChildren) {
    if (!confirm("¿Eliminar esta categoría? También se eliminarán sus subcategorías.")) return;

    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== category.id));

    const result = await deleteCategory(category.id);
    if ("error" in result) {
      setCategories(previous);
      toast.error("No se pudo eliminar la categoría", { description: result.error });
      return;
    }
    toast.success("Categoría eliminada", { description: category.name });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setModal({ parentId: null, category: null })}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <Plus size={16} /> Crear una nueva categoría
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-flow-dense grid-cols-1 gap-4 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                onEdit={() => setModal({ parentId: null, category })}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">Todavía no hay categorías</p>
          <p className="mt-1 text-sm text-slate-500">Crea la primera para organizar tu catálogo.</p>
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
