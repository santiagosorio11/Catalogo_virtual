"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Pencil, Search } from "lucide-react";
import { bulkDeleteProducts, bulkSetActive, createDraftProduct } from "@/actions/products";
import { formatCOP } from "@/lib/currency";
import type { AdminProductRow } from "@/lib/data/admin-products";
import type { Category } from "@/lib/types";

export function ProductsTable({
  products,
  categories,
  total,
  page,
  totalPages,
}: {
  products: AdminProductRow[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))
    );
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddProduct() {
    const result = await createDraftProduct();
    if ("id" in result) router.push(`/admin/productos/${result.id}`);
  }

  function handleBulk(action: "activate" | "deactivate" | "delete") {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`¿Eliminar ${ids.length} producto(s)?`)) return;

    startTransition(async () => {
      if (action === "activate") await bulkSetActive(ids, true);
      if (action === "deactivate") await bulkSetActive(ids, false);
      if (action === "delete") await bulkDeleteProducts(ids);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_auto_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("search", search);
          }}
          className="relative min-w-0 md:col-span-2 xl:col-span-1"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos"
            className="w-full rounded-lg border border-black/10 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </form>

        <select
          defaultValue={searchParams.get("categoria") ?? ""}
          onChange={(e) => updateParam("categoria", e.target.value)}
          className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm md:w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("activo") ?? ""}
          onChange={(e) => updateParam("activo", e.target.value)}
          className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm md:w-auto"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>

        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-3">
          <a
            href="/api/admin/products/export"
            className="flex min-h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium hover:bg-black/[0.03] sm:px-4"
          >
            Exportar
          </a>
          <Link
            href="/admin/productos/importar"
            className="flex min-h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium hover:bg-black/[0.03] sm:px-4"
          >
            Importar
          </Link>
          <Link
            href="/admin/productos/imagenes-lote"
            className="flex min-h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium hover:bg-black/[0.03] sm:px-4"
          >
            Imágenes por lote
          </Link>
          <button
            onClick={handleAddProduct}
            className="min-h-11 flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:flex-none"
          >
            Agregar producto
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-brand-light px-4 py-2.5 text-sm">
          <span>{selected.size} seleccionado(s)</span>
          <button
            disabled={isPending}
            onClick={() => handleBulk("activate")}
            className="font-medium text-brand hover:underline"
          >
            Activar
          </button>
          <button
            disabled={isPending}
            onClick={() => handleBulk("deactivate")}
            className="font-medium text-brand hover:underline"
          >
            Desactivar
          </button>
          <button
            disabled={isPending}
            onClick={() => handleBulk("delete")}
            className="font-medium text-red-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-black/40">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={selected.size === products.length && products.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Activo</th>
              <th className="p-3">Precio</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-black/5">
                      {product.thumbnailUrl && (
                        <Image src={product.thumbnailUrl} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </div>
                    <span className="line-clamp-1 font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="p-3 text-black/50">{product.categoryNames.join(", ") || "—"}</td>
                <td className="p-3 text-black/50">{product.sku ?? "—"}</td>
                <td className="p-3">
                  <ActiveToggle productId={product.id} active={product.active} />
                </td>
                <td className="p-3 font-medium">{formatCOP(product.price)}</td>
                <td className="p-3">
                  <Link href={`/admin/productos/${product.id}`} className="text-black/40 hover:text-brand">
                    <Pencil size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Mostrando {products.length} de {total} productos
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-lg border border-black/10 px-3 py-1.5 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-lg border border-black/10 px-3 py-1.5 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveToggle({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(active);
  const [pending, startTransition] = useTransition();

  function handleChange() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      await bulkSetActive([productId], next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={pending}
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Desactivar producto" : "Activar producto"}
      className={`relative h-[22px] w-10 overflow-hidden rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${
        checked ? "bg-brand" : "bg-black/15"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
