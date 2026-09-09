"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { updateProductStock, updateVariantStock } from "@/actions/products";
import type { InventoryRow } from "@/lib/data/admin-inventory";

const LOW_STOCK_THRESHOLD = 5;

export function InventoryTable({
  rows,
  total,
  page,
  totalPages,
}: {
  rows: InventoryRow[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos"
          className="w-full rounded-lg border border-black/10 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
        />
      </form>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="min-w-[560px] w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-black/40">
              <th className="p-3">Producto</th>
              <th className="p-3">Variante</th>
              <th className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.productId}-${row.variant?.id ?? "base"}-${idx}`}
                className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-black/5">
                      {row.thumbnailUrl && (
                        <Image src={row.thumbnailUrl} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </div>
                    <span className="line-clamp-1 font-medium">{row.productName}</span>
                  </div>
                </td>
                <td className="p-3 text-black/50">
                  {row.variant ? `${row.variant.variant_name}: ${row.variant.option_value}` : "—"}
                </td>
                <td className="p-3">
                  <StockInput row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-black/50 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {total} producto{total === 1 ? "" : "s"} en total
        </span>
        <div className="flex items-center gap-2">
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

function StockInput({ row }: { row: InventoryRow }) {
  const [value, setValue] = useState(row.stockQuantity !== null ? String(row.stockQuantity) : "");
  const isLow = row.stockQuantity !== null && row.stockQuantity <= LOW_STOCK_THRESHOLD;

  async function handleBlur() {
    const qty = Number(value) || 0;
    if (row.variant) await updateVariantStock(row.variant.id, qty);
    else await updateProductStock(row.productId, qty);
  }

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      className={`w-24 rounded-lg border px-2.5 py-1.5 text-sm ${
        isLow ? "border-red-300 bg-red-50 text-red-700" : "border-black/10"
      }`}
    />
  );
}
