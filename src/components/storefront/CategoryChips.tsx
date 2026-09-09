import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import type { CategoryWithChildren } from "@/lib/types";

export function CategoryChips({
  categories,
  activeSlug,
  logoUrl,
}: {
  categories: CategoryWithChildren[];
  activeSlug?: string;
  logoUrl: string | null;
}) {
  const activeRoot = categories.find(
    (category) =>
      category.slug === activeSlug || category.children.some((child) => child.slug === activeSlug)
  );
  const subcategories = activeRoot?.children ?? [];

  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Explora</p>
          <h2 id="categories-heading" className="mt-1 text-xl font-bold text-orbita-navy sm:text-2xl">
            Categorías
          </h2>
        </div>
        <span className="text-right text-xs font-medium text-slate-500">Desliza para ver más</span>
      </div>

      <nav
        aria-label="Categorías del catálogo"
        className="flex snap-x gap-3 overflow-x-auto px-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5"
      >
        <Link
          href="/?categoria=todo"
          className={clsx(
            "group flex w-[78px] shrink-0 snap-start flex-col items-center gap-2 text-center sm:w-24",
            activeSlug === "todo" ? "text-brand" : "text-slate-600"
          )}
        >
          <span
            className={clsx(
              "relative h-[70px] w-[70px] overflow-hidden rounded-full border-2 bg-white shadow-[0_8px_24px_rgba(4,44,69,.09)] transition-transform group-hover:-translate-y-1 sm:h-20 sm:w-20",
              activeSlug === "todo" ? "border-brand ring-4 ring-brand-light" : "border-white"
            )}
          >
            {logoUrl ? (
              <Image src={logoUrl} alt="Todos los productos" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center bg-brand-light text-xl font-bold text-brand">T</span>
            )}
          </span>
          <span className="line-clamp-2 text-xs font-semibold leading-4">Todo</span>
        </Link>

        {categories.map((category) => {
          const isActive = activeRoot?.id === category.id;
          return (
            <Link
              key={category.id}
              href={`/?categoria=${category.slug}`}
              className={clsx(
                "group flex w-[78px] shrink-0 snap-start flex-col items-center gap-2 text-center sm:w-24",
                isActive ? "text-brand" : "text-slate-600"
              )}
            >
              <span
                className={clsx(
                  "relative h-[70px] w-[70px] overflow-hidden rounded-full border-2 bg-white shadow-[0_8px_24px_rgba(4,44,69,.09)] transition-transform group-hover:-translate-y-1 sm:h-20 sm:w-20",
                  isActive ? "border-brand ring-4 ring-brand-light" : "border-white"
                )}
              >
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#e8f7fb,#c7e7f0)] text-lg font-extrabold text-brand">
                    {category.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-4">{category.name}</span>
            </Link>
          );
        })}
      </nav>

      {activeRoot && subcategories.length > 0 && (
        <nav
          aria-label={`Subcategorías de ${activeRoot.name}`}
          className="mt-2 flex gap-2 overflow-x-auto border-b border-slate-200 px-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href={`/?categoria=${activeRoot.slug}`}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              activeSlug === activeRoot.slug
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-brand-light"
            )}
          >
            Todo
          </Link>
          {subcategories.map((category) => (
            <Link
              key={category.id}
              href={`/?categoria=${category.slug}`}
              className={clsx(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                activeSlug === category.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-brand-light"
              )}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
