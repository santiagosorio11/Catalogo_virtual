import * as XLSX from "xlsx";

// Posiciones de columna del template de exportación de productos (ver
// supabase/migrations y la nota en el plan): duplican el texto de encabezado
// "OPCION VARIACION 2 (OPCIONAL)" para las columnas 7 y 9, así que se debe
// leer por posición y no por nombre de encabezado.
const COL = {
  NOMBRE: 0,
  SKU: 1,
  DESCRIPCION: 2,
  PRECIO: 3,
  PRECIO_DESCUENTO: 4,
  CATEGORIAS: 5,
  VARIACION_1_NOMBRE: 6,
  VARIACION_1_OPCION: 7,
  VARIACION_2_NOMBRE: 8,
  VARIACION_2_OPCION: 9,
  VARIACION_PRECIO: 10,
  ACTIVO: 11,
  CANTIDAD: 12,
} as const;

export interface ParsedVariant {
  variantName: string;
  optionValue: string;
  priceOverride: number | null;
  stock: number;
  sku: string | null;
}

export interface ParsedProduct {
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryPaths: string[][];
  active: boolean;
  stock: number | null;
  variants: ParsedVariant[];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normalizeSku(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str || str === ".") return null;
  return str;
}

function stripHtml(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return str || null;
}

// Algunos nombres de categoría del catálogo contienen una coma literal
// (ej. "Bases, Top y Tratamientos"), pero la coma normalmente separa varias
// categorías dentro de una misma celda. Se protegen esos nombres conocidos
// reemplazando su coma interna por un marcador antes de partir por comas,
// y se restaura el marcador a coma después. Ajustar esta lista si el
// catálogo agrega otro nombre de categoría con coma.
const CATEGORY_NAMES_WITH_COMMA = ["Bases, Top y Tratamientos"];
const COMMA_MARKER = "@@COMMA@@";

function parseCategories(value: unknown): string[][] {
  if (value === null || value === undefined) return [];
  const str = String(value).trim();
  if (!str) return [];

  let protectedStr = str;
  for (const name of CATEGORY_NAMES_WITH_COMMA) {
    const maskedName = name.replaceAll(",", COMMA_MARKER);
    protectedStr = protectedStr.replaceAll(name, maskedName);
  }

  return protectedStr
    .split(",")
    .map((segment) => segment.replaceAll(COMMA_MARKER, ","))
    .map((segment) =>
      segment
        .split(">")
        .map((level) => level.trim())
        .filter(Boolean)
    )
    .filter((path) => path.length > 0);
}

export function parseProductsWorkbook(buffer: ArrayBuffer): ParsedProduct[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  const products: ParsedProduct[] = [];
  let current: ParsedProduct | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawName = row[COL.NOMBRE];
    const name = typeof rawName === "string" ? rawName.trim() : rawName ? String(rawName) : "";

    if (name) {
      if (current) products.push(current);

      const priceBase = toNumber(row[COL.PRECIO]) ?? 0;
      const priceDiscount = toNumber(row[COL.PRECIO_DESCUENTO]) ?? 0;
      const price = priceDiscount > 0 ? priceDiscount : priceBase;
      const compareAtPrice = priceDiscount > 0 && priceBase > priceDiscount ? priceBase : null;

      const activoRaw = row[COL.ACTIVO];
      const active = activoRaw === null || activoRaw === undefined ? true : Number(activoRaw) === 1;

      current = {
        name,
        sku: normalizeSku(row[COL.SKU]),
        description: stripHtml(row[COL.DESCRIPCION]),
        price,
        compareAtPrice,
        categoryPaths: parseCategories(row[COL.CATEGORIAS]),
        active,
        stock: toNumber(row[COL.CANTIDAD]),
        variants: [],
      };

      const variantName = row[COL.VARIACION_1_NOMBRE];
      if (variantName) {
        current.variants.push({
          variantName: String(variantName).trim(),
          optionValue: String(row[COL.VARIACION_1_OPCION] ?? "").trim(),
          priceOverride: toNumber(row[COL.VARIACION_PRECIO]),
          stock: toNumber(row[COL.CANTIDAD]) ?? 0,
          sku: normalizeSku(row[COL.SKU]),
        });
      }
    } else if (current) {
      const variantName = row[COL.VARIACION_1_NOMBRE];
      const optionValue = row[COL.VARIACION_1_OPCION];
      if (variantName || optionValue) {
        current.variants.push({
          variantName: String(variantName ?? current.variants[0]?.variantName ?? "Opción").trim(),
          optionValue: String(optionValue ?? "").trim(),
          priceOverride: toNumber(row[COL.VARIACION_PRECIO]),
          stock: toNumber(row[COL.CANTIDAD]) ?? 0,
          sku: normalizeSku(row[COL.SKU]),
        });
      }
    }
  }

  if (current) products.push(current);
  return products;
}
