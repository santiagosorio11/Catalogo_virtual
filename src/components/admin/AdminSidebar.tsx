"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Boxes,
  ClipboardList,
  ExternalLink,
  Grid3x3,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  X,
} from "lucide-react";
import { logout } from "@/actions/auth";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/home", label: "Portada", icon: Home },
  { href: "/admin/categorias", label: "Categorías", icon: Grid3x3 },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/configuraciones", label: "Ajustes", icon: Settings },
];

function OrbitaBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" className={compact ? "h-8 w-8" : "h-9 w-9"} aria-hidden="true">
        <circle cx="22" cy="26" r="15" fill="none" stroke="#63b7cc" strokeWidth="1.5" />
        <path d="M8 17c10 2 20-2 28-11-3 10-10 16-20 18" fill="#63b7cc" opacity=".9" />
        <circle cx="36" cy="8" r="2.7" fill="#a8deea" />
      </svg>
      <div>
        <p className="text-base font-semibold tracking-tight text-white">
          Órbita<span className="text-orbita-cyan">.IA</span>
        </p>
        {!compact && <p className="text-[10px] uppercase tracking-[0.17em] text-white/35">Catálogo operativo</p>}
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navigation = (
    <nav className="flex-1 space-y-1 px-3" aria-label="Navegación del dashboard">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={clsx(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-orbita-cyan text-orbita-navy shadow-[0_10px_24px_-14px_rgba(99,183,204,0.9)]"
                : "text-white/60 hover:bg-white/[0.07] hover:text-white"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 px-3 py-4">
      <Link
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mb-2 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
      >
        <ExternalLink size={18} />
        Ver catálogo
      </Link>
      <p className="truncate px-3 pb-2 text-xs text-white/35">{email}</p>
      <form action={logout}>
        <button
          type="submit"
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-orbita-navy px-4 lg:hidden">
        <OrbitaBrand compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
          aria-label="Abrir navegación"
          aria-expanded={open}
        >
          <Menu size={21} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Cerrar navegación"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col bg-orbita-navy text-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <OrbitaBrand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
                aria-label="Cerrar navegación"
              >
                <X size={20} />
              </button>
            </div>
            {navigation}
            {account}
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-[100dvh] w-56 shrink-0 flex-col bg-orbita-navy text-white lg:flex xl:w-60">
        <div className="px-5 py-6">
          <OrbitaBrand />
        </div>
        {navigation}
        {account}
      </aside>
    </>
  );
}
