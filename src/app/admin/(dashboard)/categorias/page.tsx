import { getCategoryTree } from "@/lib/data/queries";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default async function CategoriasPage() {
  const categories = await getCategoryTree();

  return (
    <>
      <AdminTopbar title="Categorías" />
      <div className="admin-enter p-4 sm:p-6">
        <p className="mb-5 text-sm text-black/50">
          Agrupa los productos y arrastra las categorías para ordenar el catálogo. Entra en
          Configurar para editar su imagen y administrar sus propias subcategorías.
        </p>
        <CategoriesManager key={JSON.stringify(categories)} initial={categories} />
      </div>
    </>
  );
}
