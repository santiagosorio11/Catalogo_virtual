"use client";

import { useRef, useState } from "react";
import { ModalPortal } from "./ModalPortal";
import Image from "next/image";
import { X } from "lucide-react";
import {
  createCategory,
  updateCategory,
  uploadCategoryImage,
} from "@/actions/categories";
import { useToast } from "@/components/ui/Toast";
import type { Category } from "@/lib/types";

export function CategoryFormModal({
  parentId,
  category,
  onClose,
}: {
  parentId: string | null;
  category?: Category | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(category?.name ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entityLabel = parentId ? "subcategoría" : "categoría";

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !category) return;
    const toastId = toast.loading("Subiendo imagen...", { description: file.name });
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCategoryImage(category.id, formData);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if ("error" in result) {
      toast.update(toastId, {
        variant: "error",
        title: "No se pudo subir la imagen",
        description: result.error,
      });
      return;
    }

    setImageUrl(result.url ?? null);
    toast.update(toastId, {
      variant: "success",
      title: "Imagen subida correctamente",
      description: null,
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Escribe un nombre para continuar.");
      toast.warning(`Escribe el nombre de la ${entityLabel}`);
      return;
    }
    setSaving(true);
    setError(null);

    const result = category
      ? await updateCategory(category.id, { name, imageUrl })
      : await createCategory({ name, parentId, imageUrl });

    setSaving(false);
    if (result && "error" in result) {
      const message = result.error ?? "Ocurrió un error.";
      setError(message);
      toast.error(
        category
          ? `No se pudo actualizar la ${entityLabel}`
          : `No se pudo crear la ${entityLabel}`,
        { description: message }
      );
      return;
    }

    toast.success(
      category
        ? `${parentId ? "Subcategoría" : "Categoría"} actualizada`
        : `${parentId ? "Subcategoría" : "Categoría"} creada`,
      { description: name.trim() }
    );
    onClose();
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/40 p-4 sm:items-center sm:p-6"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="category-modal-title" className="text-base font-semibold">
            {category ? "Editar categoría" : parentId ? "Nueva subcategoría" : "Nueva categoría"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-black/40 hover:bg-slate-100 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {category && (
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-black/5">
              {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" />}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-brand hover:underline"
            >
              Cambiar imagen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="mt-1.5 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          URL de imagen <span className="font-normal text-slate-400">(opcional)</span>
          <input
            value={imageUrl ?? ""}
            onChange={(e) => setImageUrl(e.target.value.trim() || null)}
            placeholder="https://..."
            inputMode="url"
            className="mt-1.5 w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="mt-4 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
