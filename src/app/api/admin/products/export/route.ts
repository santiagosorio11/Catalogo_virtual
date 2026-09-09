import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductVariant } from "@/lib/types";

function categoryPath(categoryId: string, byId: Map<string, Category>): string {
  const names: string[] = [];
  let current: Category | undefined = byId.get(categoryId);
  while (current) {
    names.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return names.join(" > ");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [{ data: products }, { data: variants }, { data: categories }, { data: catLinks }] =
    await Promise.all([
      supabase.from("products").select("*").order("created_at"),
      supabase.from("product_variants").select("*").order("sort_order"),
      supabase.from("categories").select("*"),
      supabase.from("product_categories").select("*"),
    ]);

  const categoryById = new Map<string, Category>(
    ((categories ?? []) as Category[]).map((c) => [c.id, c])
  );
  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const v of (variants ?? []) as ProductVariant[]) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    variantsByProduct.get(v.product_id)!.push(v);
  }
  const categoriesByProduct = new Map<string, string[]>();
  for (const link of catLinks ?? []) {
    if (!categoriesByProduct.has(link.product_id)) categoriesByProduct.set(link.product_id, []);
    categoriesByProduct.get(link.product_id)!.push(link.category_id);
  }

  const header = [
    "NOMBRE PRODUCTO",
    "REFERENCIA - SKU",
    "DESCRIPCIÓN",
    "PRECIO",
    "PRECIO CON DESCUENTO",
    "CATEGORIAS",
    "NOMBRE VARIACION 1 (OPCIONAL)",
    "OPCION VARIACION 1 (OPCIONAL)",
    "OPCION PRECIO VARIACIÓN (OPCIONAL)",
    "ACTIVO",
    "CANTIDAD",
  ];

  const rows: (string | number | null)[][] = [header];

  for (const product of (products ?? []) as Product[]) {
    const categoryLabel = (categoriesByProduct.get(product.id) ?? [])
      .map((id) => categoryPath(id, categoryById))
      .join(",");
    const productVariants = variantsByProduct.get(product.id) ?? [];

    if (productVariants.length === 0) {
      rows.push([
        product.name,
        product.sku ?? "",
        product.description ?? "",
        product.compare_at_price ?? product.price,
        product.compare_at_price ? product.price : 0,
        categoryLabel,
        "",
        "",
        "",
        product.active ? 1 : 0,
        product.stock_quantity ?? "",
      ]);
    } else {
      productVariants.forEach((variant, idx) => {
        rows.push([
          idx === 0 ? product.name : "",
          product.sku ?? "",
          idx === 0 ? product.description ?? "" : "",
          idx === 0 ? product.compare_at_price ?? product.price : "",
          idx === 0 ? (product.compare_at_price ? product.price : 0) : "",
          idx === 0 ? categoryLabel : "",
          variant.variant_name,
          variant.option_value,
          variant.price_override ?? "",
          idx === 0 ? (product.active ? 1 : 0) : "",
          variant.stock_quantity,
        ]);
      });
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="productos.xlsx"`,
    },
  });
}
