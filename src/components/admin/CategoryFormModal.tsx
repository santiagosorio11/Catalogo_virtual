"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import {
  createCategory,
  updateCategory,
  uploadCategoryImage,
} from "@/actions/categories";
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
  const [name, setName] = useState(category?.name ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !category) return;
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCategoryImage(category.id, formData);
    if ("url" in result) setImageUrl(result.url ?? null);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const result = category
      ? await updateCategory(category.id, { name, imageUrl })
      : await createCategory({ name, parentId, imageUrl });

    setSaving(false);
    if (result && "error" in result) {
      setError(result.error ?? "Ocurrió un error.");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
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
  );
}
