"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatCOP } from "@/lib/currency";

interface HeaderProps {
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  whatsappNumber: string | null;
  compact?: boolean;
}

export function Header({
  storeName,
  logoUrl,
  bannerUrl,
  description,
  whatsappNumber,
  compact = false,
}: HeaderProps) {
  const { totalQuantity, subtotal } = useCart();
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  if (compact) {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                <Image src={logoUrl} alt="" fill sizes="40px" className="object-cover" />
              </span>
            ) : null}
            <span className="truncate text-base font-bold text-orbita-navy">{storeName}</span>
          </Link>
          <Link
            href="/carrito"
            aria-label={`Ver carrito con ${totalQuantity} productos`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"
          >
            <ShoppingBag size={19} />
            {totalQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {totalQuantity}
              </span>
            )}
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="mx-auto w-full max-w-7xl bg-white shadow-[0_18px_50px_rgba(4,36,56,0.08)] sm:mt-5 sm:overflow-hidden sm:rounded-[28px]">
      <div className="relative aspect-[2.7/1] min-h-36 w-full overflow-hidden bg-orbita-navy sm:min-h-52">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`Banner de ${storeName}`}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(99,183,204,.55),transparent_32%),linear-gradient(130deg,#031b2d,#0b4764)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

        <Link
          href="/carrito"
          aria-label={`Ver carrito con ${totalQuantity} productos`}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:top-5"
        >
          <ShoppingBag size={19} />
          {totalQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand shadow">
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>

      <div className="relative px-4 pb-5 pt-14 sm:px-8 sm:pb-7 sm:pt-16">
        <Link
          href="/"
          className="absolute -top-11 left-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-xl sm:-top-14 sm:left-8 sm:h-28 sm:w-28"
          aria-label={`Ir al inicio de ${storeName}`}
        >
          {logoUrl ? (
            <Image src={logoUrl} alt={storeName} fill sizes="112px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-brand-light text-3xl font-bold text-brand">
              {storeName.charAt(0)}
            </span>
          )}
        </Link>

        <div className="sm:pl-32">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="max-w-2xl text-2xl font-extrabold leading-tight tracking-[-0.03em] text-orbita-navy sm:text-3xl">
              {storeName}
            </h1>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <MessageCircle size={14} fill="currentColor" /> Tienda WhatsApp
              </a>
            )}
          </div>
          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              {description}
            </p>
          )}
        </div>
      </div>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir WhatsApp de la tienda"
          className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#18c86e] text-white shadow-[0_12px_30px_rgba(24,200,110,.35)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${totalQuantity > 0 ? "bottom-24" : "bottom-5"}`}
        >
          <MessageCircle size={27} />
        </a>
      )}

      {totalQuantity > 0 && (
        <Link
          href="/carrito"
          className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-orbita-navy px-4 py-3 text-white shadow-[0_18px_45px_rgba(3,27,45,.3)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <ShoppingBag size={20} />
            </span>
            <span>
              <strong className="block text-sm">
                {totalQuantity} {totalQuantity === 1 ? "producto" : "productos"}
              </strong>
              <span className="text-xs text-white/70">Ver carrito</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-sm font-bold">
            {formatCOP(subtotal)} <ChevronRight size={17} />
          </span>
        </Link>
      )}
    </header>
  );
}
