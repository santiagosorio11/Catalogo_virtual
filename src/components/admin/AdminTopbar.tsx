import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function AdminTopbar({
  title,
  actions,
  backHref = "/admin",
}: {
  title: string;
  actions?: React.ReactNode;
  backHref?: string | null;
}) {
  return (
    <header className="sticky top-14 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Volver atrás"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-orbita-cyan/70 hover:bg-orbita-cyan-soft hover:text-orbita-navy"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        )}
        <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex min-h-10 items-center gap-2 rounded-xl bg-orbita-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-orbita-navy-soft sm:px-4"
        >
          <span className="hidden sm:inline">Ver catálogo</span>
          <ExternalLink size={16} />
        </Link>
      </div>
    </header>
  );
}
