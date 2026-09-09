"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function Header({
  storeName,
  logoUrl,
}: {
  storeName: string;
  logoUrl: string | null;
}) {
  const { totalQuantity } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand font-bold">
              {storeName.charAt(0)}
            </div>
          )}
          <span className="text-lg font-semibold text-[var(--foreground)]">{storeName}</span>
        </Link>

        <Link
          href="/carrito"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-black/5"
        >
          <ShoppingCart size={22} />
          {totalQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-semibold text-white">
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
