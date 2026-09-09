import Link from "next/link";
import clsx from "clsx";
import type { Category } from "@/lib/types";

export function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/"
        className={clsx(
          "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          !activeSlug
            ? "bg-brand text-white"
            : "bg-black/5 text-[var(--foreground)] hover:bg-black/10"
        )}
      >
        Todo
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/?categoria=${category.slug}`}
          className={clsx(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeSlug === category.slug
              ? "bg-brand text-white"
              : "bg-black/5 text-[var(--foreground)] hover:bg-black/10"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
