"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { formatCOP } from "@/lib/currency";
import { useCart } from "@/context/cart-context";
import type { ProductWithRelations } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const { addItem } = useCart();
  const image = product.images[0]?.url ?? null;
  const hasVariants = product.variants.length > 0;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (hasVariants) {
      router.push(`/producto/${product.slug}`);
      return;
    }
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      variantLabel: null,
      unitPrice: product.price,
      quantity: 1,
      imageUrl: image,
      slug: product.slug,
    });
  }

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-black/30">
            Sin imagen
          </div>
        )}
        <button
          onClick={handleQuickAdd}
          aria-label="Agregar al carrito"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand shadow hover:bg-brand hover:text-white"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-[var(--foreground)]">
          {product.name}
        </p>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold text-brand">{formatCOP(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-black/40 line-through">
              {formatCOP(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
