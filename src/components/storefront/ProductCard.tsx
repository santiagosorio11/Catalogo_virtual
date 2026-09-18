"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { formatCOP } from "@/lib/currency";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/Toast";
import type { ProductWithRelations } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();
  const image = product.images[0]?.url ?? null;
  const hasVariants = product.variants.length > 0;

  function handleQuickAdd() {
    if (hasVariants) {
      toast.info("Elige una opción antes de agregar", { description: product.name });
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
    toast.success("Producto agregado al carrito", { description: product.name });
  }

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(5,42,64,.05)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(5,42,64,.11)]">
      <Link
        href={`/producto/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-[linear-gradient(145deg,#f8fbfd,#eef5f8)] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
        aria-label={`Ver ${product.name}`}
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04] sm:p-3"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-slate-400">
            Imagen próximamente
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={handleQuickAdd}
        aria-label={`Agregar ${product.name} al carrito`}
        className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-orbita-navy shadow-md transition-colors hover:border-brand hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Plus size={18} />
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.sku && (
          <span className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {product.sku}
          </span>
        )}
        <Link
          href={`/producto/${product.slug}`}
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-orbita-navy hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-extrabold text-orbita-navy">
            {formatCOP(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatCOP(product.compare_at_price)}
            </span>
          )}
        </div>
        <Link
          href={`/producto/${product.slug}`}
          className="mt-3 flex min-h-9 items-center justify-center rounded-full border border-slate-200 px-3 text-xs font-semibold text-orbita-navy transition-colors hover:border-brand hover:bg-brand-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
}
