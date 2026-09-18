"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import {
  addVariant,
  deleteProduct,
  deleteProductImage,
  deleteVariant,
  updateProduct,
  updateVariant,
  uploadProductImage,
} from "@/actions/products";
import { useToast } from "@/components/ui/Toast";
import type { Category, ProductWithRelations } from "@/lib/types";

export function ProductEditor({
  product,
  categories,
}: {
  product: ProductWithRelations;
  categories: Category[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compare_at_price ? String(product.compare_at_price) : ""
  );
  const [active, setActive] = useState(product.active);
  const [categoryIds, setCategoryIds] = useState<Set<string>>(
    new Set(product.categories.map((c) => c.id))
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateProduct(product.id, {
      name,
      sku: sku.trim() || null,
      description: description.trim() || null,
      price: Number(price) || 0,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      active,
      categoryIds: Array.from(categoryIds),
    });
    setSaving(false);

    if ("error" in result) {
      toast.error("No se pudo guardar el producto", { description: result.error });
      return;
    }

    toast.success(`Producto ${active ? "actualizado" : "actualizado y desactivado"}`, {
      description: name.trim() || undefined,
    });
    router.refresh();
  }

  async function handleDeleteProduct() {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    const result = await deleteProduct(product.id);
    if ("error" in result) {
      toast.error("No se pudo eliminar el producto", { description: result.error });
      return;
    }
    toast.success("Producto eliminado", { description: product.name });
    router.push("/admin/productos");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Subiendo imagen...", { description: file.name });
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProductImage(product.id, formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if ("error" in result) {
      toast.update(toastId, {
        variant: "error",
        title: "No se pudo subir la imagen",
        description: result.error,
      });
      return;
    }

    toast.update(toastId, {
      variant: "success",
      title: "Imagen subida correctamente",
      description: null,
    });
    router.refresh();
  }

  async function handleImageDelete(imageId: string) {
    const result = await deleteProductImage(imageId, product.id);
    if ("error" in result) {
      toast.error("No se pudo eliminar la imagen", { description: result.error });
      return;
    }
    toast.success("Imagen eliminada");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-black/60">Información</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-black/40">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-black/40">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-black/40">Descripción</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-black/40">Precio</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-black/40">Precio antes de descuento</label>
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Producto activo (visible en la tienda)
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-black/60">Categorías</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  categoryIds.has(c.id)
                    ? "border-brand bg-brand-light text-brand"
                    : "border-black/10 text-black/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>

        <VariantsSection product={product} />

        <section className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-black/60">Imágenes</h2>
          <div className="flex flex-wrap gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-lg bg-black/5">
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                <button
                  onClick={() => handleImageDelete(img.id)}
                  aria-label="Eliminar imagen"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-black/10 text-black/30 hover:border-brand hover:text-brand"
            >
              <Plus size={20} />
              <span className="text-xs">{uploading ? "Subiendo..." : "Agregar"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-red-600">Zona de peligro</h2>
          <button
            onClick={handleDeleteProduct}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} /> Eliminar producto
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantsSection({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [variantName, setVariantName] = useState("Tamaño");
  const [optionValue, setOptionValue] = useState("");
  const [priceOverride, setPriceOverride] = useState("");

  async function handleAdd() {
    if (!optionValue.trim()) {
      toast.warning("Escribe la opción de la variante", {
        description: "Por ejemplo: 15 ml.",
      });
      return;
    }
    const result = await addVariant(product.id, {
      variantName: variantName.trim() || "Opción",
      optionValue: optionValue.trim(),
      priceOverride: priceOverride ? Number(priceOverride) : null,
      sku: null,
    });

    if ("error" in result) {
      toast.error("No se pudo agregar la variante", { description: result.error });
      return;
    }

    toast.success("Variante agregada", { description: optionValue.trim() });
    setOptionValue("");
    setPriceOverride("");
    setAdding(false);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black/60">Variantes</h2>
        <button onClick={() => setAdding((v) => !v)} className="text-sm font-medium text-brand hover:underline">
          {adding ? "Cancelar" : "+ Agregar variante"}
        </button>
      </div>

      {adding && (
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-black/[0.02] p-3 sm:grid-cols-3">
          <input
            placeholder="Nombre (ej. Tamaño)"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className="rounded-lg border border-black/10 px-2.5 py-2 text-sm"
          />
          <input
            placeholder="Opción (ej. 15 ml)"
            value={optionValue}
            onChange={(e) => setOptionValue(e.target.value)}
            className="rounded-lg border border-black/10 px-2.5 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Precio"
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value)}
            className="rounded-lg border border-black/10 px-2.5 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-brand py-2 text-sm font-medium text-white sm:col-span-3"
          >
            Guardar variante
          </button>
        </div>
      )}

      {product.variants.length === 0 ? (
        <p className="text-sm text-black/40">Este producto no tiene variantes.</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {product.variants.map((variant) => (
            <VariantRow key={variant.id} productId={product.id} variant={variant} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VariantRow({
  productId,
  variant,
}: {
  productId: string;
  variant: ProductWithRelations["variants"][number];
}) {
  const router = useRouter();
  const toast = useToast();
  const [optionValue, setOptionValue] = useState(variant.option_value);
  const [priceOverride, setPriceOverride] = useState(
    variant.price_override !== null ? String(variant.price_override) : ""
  );
  const savedValues = useRef({
    optionValue: variant.option_value,
    priceOverride: variant.price_override !== null ? String(variant.price_override) : "",
  });

  async function handleBlurSave() {
    // Solo guardamos (y avisamos) cuando el campo realmente cambió.
    if (
      savedValues.current.optionValue === optionValue &&
      savedValues.current.priceOverride === priceOverride
    ) {
      return;
    }

    const result = await updateVariant(variant.id, productId, {
      variantName: variant.variant_name,
      optionValue,
      priceOverride: priceOverride ? Number(priceOverride) : null,
      sku: variant.sku,
    });

    if ("error" in result) {
      toast.error("No se pudo actualizar la variante", { description: result.error });
      return;
    }

    savedValues.current = { optionValue, priceOverride };
    toast.success("Variante actualizada", { description: optionValue });
    router.refresh();
  }

  async function handleDelete() {
    const result = await deleteVariant(variant.id, productId);
    if ("error" in result) {
      toast.error("No se pudo eliminar la variante", { description: result.error });
      return;
    }
    toast.success("Variante eliminada", { description: variant.option_value });
    router.refresh();
  }

  return (
    <li className="grid grid-cols-2 items-center gap-2 py-2.5 sm:grid-cols-4">
      <span className="text-xs text-black/40">{variant.variant_name}</span>
      <input
        value={optionValue}
        onChange={(e) => setOptionValue(e.target.value)}
        onBlur={handleBlurSave}
        className="rounded-lg border border-black/10 px-2 py-1.5 text-sm"
      />
      <input
        type="number"
        value={priceOverride}
        onChange={(e) => setPriceOverride(e.target.value)}
        onBlur={handleBlurSave}
        placeholder="Precio"
        className="rounded-lg border border-black/10 px-2 py-1.5 text-sm"
      />
      <button
        onClick={handleDelete}
        aria-label={`Eliminar variante ${variant.option_value}`}
        className="flex items-center justify-center text-black/30 hover:text-red-500"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
