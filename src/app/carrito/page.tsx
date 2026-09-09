"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatCOP } from "@/lib/currency";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-black/50 hover:text-black">
        <ArrowLeft size={16} /> Seguir comprando
      </Link>

      <h1 className="mb-4 text-xl font-semibold">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-black/40">Tu carrito está vacío.</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-black/5">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-black/40">{item.variantLabel}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-brand">{formatCOP(item.unitPrice)}</p>
                </div>
                <div className="flex items-center rounded-lg border border-black/10">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center text-black/60"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-black/60"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-black/30 hover:text-red-500"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-sm text-black/50">Subtotal</span>
            <span className="text-lg font-bold">{formatCOP(subtotal)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-4 block rounded-lg bg-brand py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Continuar
          </Link>
        </>
      )}
    </main>
  );
}
