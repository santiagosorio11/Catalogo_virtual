"use client";

import { useRef, useState } from "react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { importProductsFromXlsx, type ImportSummary } from "@/actions/products";
import { useToast } from "@/components/ui/Toast";

export default function ImportarProductosPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.warning("Selecciona el archivo .xlsx que quieres importar");
      return;
    }

    setLoading(true);
    setSummary(null);
    const toastId = toast.loading("Importando productos...", {
      description: `${file.name} · esto puede tardar unos minutos.`,
    });

    const formData = new FormData();
    formData.append("file", file);
    const result = await importProductsFromXlsx(formData);
    setSummary(result);
    setLoading(false);

    const processed = result.productsCreated + result.productsUpdated;
    if (processed === 0 && result.errors.length > 0) {
      toast.update(toastId, {
        variant: "error",
        title: "No se pudo importar el archivo",
        description: result.errors[0],
      });
      return;
    }

    toast.update(toastId, {
      variant: result.errors.length > 0 ? "warning" : "success",
      title:
        result.errors.length > 0
          ? `Importación con ${result.errors.length} ${result.errors.length === 1 ? "error" : "errores"}`
          : "Productos importados correctamente",
      description: `${result.productsCreated} creados · ${result.productsUpdated} actualizados · ${result.categoriesCreated} categorías nuevas.`,
    });
  }

  return (
    <>
      <AdminTopbar title="Importar productos" backHref="/admin/productos" />
      <div className="admin-enter p-4 sm:p-6">
        <div className="max-w-xl rounded-2xl border border-black/5 bg-white p-4 sm:p-6">
          <p className="mb-4 text-sm text-black/60">
            Sube el archivo .xlsx con tus productos (mismo formato exportado por la plataforma:
            NOMBRE PRODUCTO, REFERENCIA - SKU, DESCRIPCIÓN, PRECIO, CATEGORIAS, variantes y ACTIVO).
            Los productos con el mismo SKU se actualizan; los nuevos se crean. Este
            archivo no trae fotos — súbelas después con &quot;Subir imágenes por lote&quot;.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Importando... esto puede tardar unos minutos" : "Importar"}
            </button>
          </form>

          {summary && (
            <div className="mt-5 rounded-lg bg-black/[0.03] p-4 text-sm">
              <p>✅ Productos creados: {summary.productsCreated}</p>
              <p>♻️ Productos actualizados: {summary.productsUpdated}</p>
              <p>🗂️ Categorías creadas: {summary.categoriesCreated}</p>
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
