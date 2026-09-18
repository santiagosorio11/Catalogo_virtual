"use client";

import { useRef, useState } from "react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { importImagesZip, type BulkImageSummary } from "@/actions/products";
import { useToast } from "@/components/ui/Toast";

export default function ImagenesLotePage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BulkImageSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.warning("Selecciona el archivo .zip con las imágenes");
      return;
    }

    setLoading(true);
    setSummary(null);
    const toastId = toast.loading("Subiendo imágenes...", {
      description: `${file.name} · esto puede tardar unos minutos.`,
    });

    const formData = new FormData();
    formData.append("file", file);
    const result = await importImagesZip(formData);
    setSummary(result);
    setLoading(false);

    if (result.imagesUploaded === 0) {
      toast.update(toastId, {
        variant: "error",
        title: "No se subió ninguna imagen",
        description:
          result.errors[0] ??
          (result.skusNotFound.length > 0
            ? `Ningún SKU coincidió: ${result.skusNotFound.slice(0, 5).join(", ")}`
            : "Revisa que el .zip tenga una carpeta por SKU."),
      });
      return;
    }

    const pending = [
      result.skusNotFound.length > 0
        ? `${result.skusNotFound.length} SKU sin producto`
        : null,
      result.errors.length > 0 ? `${result.errors.length} con error` : null,
    ].filter(Boolean);

    toast.update(toastId, {
      variant: pending.length > 0 ? "warning" : "success",
      title: `${result.imagesUploaded} ${result.imagesUploaded === 1 ? "imagen subida" : "imágenes subidas"}`,
      description: [
        `${result.productsMatched} ${result.productsMatched === 1 ? "producto actualizado" : "productos actualizados"}`,
        ...pending,
      ].join(" · "),
    });
  }

  return (
    <>
      <AdminTopbar title="Subir imágenes por lote" backHref="/admin/productos" />
      <div className="admin-enter p-4 sm:p-6">
        <div className="max-w-xl rounded-2xl border border-black/5 bg-white p-4 sm:p-6">
          <p className="mb-4 text-sm text-black/60">
            Archivo: solo .zip. Dentro, una carpeta por SKU; en cada carpeta, imágenes (JPG o PNG
            recomendadas). El nombre de la carpeta debe coincidir con la REFERENCIA - SKU del
            producto.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Subiendo... esto puede tardar unos minutos" : "Subir imágenes"}
            </button>
          </form>

          {summary && (
            <div className="mt-5 rounded-lg bg-black/[0.03] p-4 text-sm">
              <p>🖼️ Imágenes subidas: {summary.imagesUploaded}</p>
              <p>📦 Productos encontrados: {summary.productsMatched}</p>
              {summary.skusNotFound.length > 0 && (
                <p className="mt-1 text-amber-600">
                  SKUs sin producto: {summary.skusNotFound.join(", ")}
                </p>
              )}
              {summary.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-600">{summary.errors.length} errores:</p>
                  <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-red-600">
                    {summary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
