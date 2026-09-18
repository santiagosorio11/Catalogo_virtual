"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { formatCOP } from "@/lib/currency";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/components/ui/Toast";
import type { ProductWithRelations } from "@/lib/types";

export function ProductDetail({ product }: { product: ProductWithRelations }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variantGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const v of product.variants) {
      if (!groups.has(v.variant_name)) groups.set(v.variant_name, []);
      const options = groups.get(v.variant_name)!;
      if (!options.includes(v.option_value)) options.push(v.option_value);
    }
    return Array.from(groups.entries());
  }, [product.variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [name, options] of variantGroups) {
      if (options.length > 0) initial[name] = options[0];
    }
    return initial;
  });

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) return null;
    const [groupName] = variantGroups[0] ?? [];
    if (!groupName) return product.variants[0];
    return (
      product.variants.find((v) => v.option_value === selectedOptions[groupName]) ??
      product.variants[0]
    );
  }, [product.variants, selectedOptions, variantGroups]);

  const price = selectedVariant?.price_override ?? product.price;
  const images = product.images.length > 0 ? product.images : [{ id: "placeholder", url: "", sort_order: 0, product_id: product.id }];

  function handleAdd() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      variantLabel: selectedVariant ? selectedVariant.option_value : null,
      unitPrice: price,
      quantity,
      imageUrl: product.images[0]?.url ?? null,
      slug: product.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast.success("Producto agregado al carrito", {
      description: `${quantity} × ${product.name}${
        selectedVariant ? ` · ${selectedVariant.option_value}` : ""
      }`,
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-black/50 hover:text-black">
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/5">
            {images[activeImage]?.url ? (
              <Image
                src={images[activeImage].url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-black/30">
                Sin imagen
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={clsx(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                    activeImage === idx ? "border-brand" : "border-transparent"
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{product.name}</h1>
          {product.sku && <p className="mt-1 text-xs text-black/40">SKU: {product.sku}</p>}

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand">{formatCOP(price)}</span>
            {product.compare_at_price && product.compare_at_price > price && (
              <span className="text-sm text-black/40 line-through">
                {formatCOP(product.compare_at_price)}
              </span>
            )}
          </div>

          {variantGroups.map(([name, options]) => (
            <div key={name} className="mt-4">
              <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{name}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, [name]: option }))}
                    className={clsx(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      selectedOptions[name] === option
                        ? "border-brand bg-brand text-white"
                        : "border-black/10 text-[var(--foreground)] hover:border-brand"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/60">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-black/10">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center text-black/60 hover:text-black"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center text-black/60 hover:text-black"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              {added ? "¡Agregado!" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
