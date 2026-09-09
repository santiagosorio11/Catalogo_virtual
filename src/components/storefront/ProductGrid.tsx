import { ProductCard } from "./ProductCard";
import type { ProductWithRelations } from "@/lib/types";

export function ProductGrid({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-black/40">
        No hay productos en esta categoría todavía.
      </p>
    );
  }

  return (
    <div className="grid grid-flow-row-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
