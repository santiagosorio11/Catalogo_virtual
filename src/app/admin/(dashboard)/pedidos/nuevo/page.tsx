import { AdminTopbar } from "@/components/admin/AdminTopbar";
import {
  ManualOrderForm,
  type ManualOrderCatalogOption,
} from "@/components/admin/ManualOrderForm";
import { getAllStoreLocations, getProducts } from "@/lib/data/queries";

export default async function NuevoPedidoPage() {
  const [products, locations] = await Promise.all([
    getProducts({ onlyActive: false }),
    getAllStoreLocations(),
  ]);

  const catalogOptions = products.flatMap<ManualOrderCatalogOption>((product) => {
    if (product.variants.length === 0) {
      return [
        {
          key: `${product.id}:`,
          productId: product.id,
          variantId: null,
          label: product.name,
          unitPrice: Number(product.price),
        },
      ];
    }

    return product.variants.map((variant) => ({
      key: `${product.id}:${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      label: `${product.name} — ${variant.variant_name}: ${variant.option_value}`,
      unitPrice: Number(variant.price_override ?? product.price),
    }));
  });

  return (
    <>
      <AdminTopbar title="Crear pedido manual" backHref="/admin/pedidos" />
      <div className="admin-enter p-4 sm:p-6">
        {catalogOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="font-semibold text-slate-800">No hay productos para agregar</h2>
            <p className="mt-1 text-sm text-slate-500">Crea al menos un producto antes de registrar un pedido.</p>
          </div>
        ) : (
          <ManualOrderForm catalogOptions={catalogOptions} locations={locations} />
        )}
      </div>
    </>
  );
}
