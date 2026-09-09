import { getAdminProducts } from "@/lib/data/admin-products";
import { getAllCategoriesFlat } from "@/lib/data/queries";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ProductsTable } from "@/components/admin/ProductsTable";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    activo?: "true" | "false";
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    getAdminProducts({
      search: params.search,
      categoryId: params.categoria,
      active: params.activo,
      page: params.page ? Number(params.page) : 1,
    }),
    getAllCategoriesFlat(),
  ]);

  return (
    <>
      <AdminTopbar title="Productos" />
      <div className="admin-enter p-4 sm:p-6">
        <ProductsTable
          products={products}
          categories={categories}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
