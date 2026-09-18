import * as XLSX from "xlsx";

export interface ParsedVariant {
  variantName: string;
  optionValue: string;
  priceOverride: number | null;
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
  variants: ParsedVariant[];
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function columnIndex(headers: unknown[], label: string, fallback: number) {
  const index = headers.findIndex((header) => normalizeHeader(header) === normalizeHeader(label));
  return index >= 0 ? index : fallback;
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
  const headers = rows[0] ?? [];
  const col = {
    NOMBRE: columnIndex(headers, "NOMBRE PRODUCTO", 0),
    SKU: columnIndex(headers, "REFERENCIA - SKU", 1),
    DESCRIPCION: columnIndex(headers, "DESCRIPCIÓN", 2),
    PRECIO: columnIndex(headers, "PRECIO", 3),
    PRECIO_DESCUENTO: columnIndex(headers, "PRECIO CON DESCUENTO", 4),
    CATEGORIAS: columnIndex(headers, "CATEGORIAS", 5),
    VARIACION_1_NOMBRE: columnIndex(headers, "NOMBRE VARIACION 1 (OPCIONAL)", 6),
    VARIACION_1_OPCION: columnIndex(headers, "OPCION VARIACION 1 (OPCIONAL)", 7),
    VARIACION_PRECIO: columnIndex(headers, "OPCION PRECIO VARIACIÓN (OPCIONAL)", 8),
    ACTIVO: columnIndex(headers, "ACTIVO", 9),
  };

  const products: ParsedProduct[] = [];
  let current: ParsedProduct | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawName = row[col.NOMBRE];
    const name = typeof rawName === "string" ? rawName.trim() : rawName ? String(rawName) : "";

    if (name) {
      if (current) products.push(current);

      const priceBase = toNumber(row[col.PRECIO]) ?? 0;
      const priceDiscount = toNumber(row[col.PRECIO_DESCUENTO]) ?? 0;
      const price = priceDiscount > 0 ? priceDiscount : priceBase;
      const compareAtPrice = priceDiscount > 0 && priceBase > priceDiscount ? priceBase : null;

      const activoRaw = row[col.ACTIVO];
      const active = activoRaw === null || activoRaw === undefined ? true : Number(activoRaw) === 1;

      current = {
        name,
        sku: normalizeSku(row[col.SKU]),
        description: stripHtml(row[col.DESCRIPCION]),
        price,
        compareAtPrice,
        categoryPaths: parseCategories(row[col.CATEGORIAS]),
        active,
        variants: [],
      };

      const variantName = row[col.VARIACION_1_NOMBRE];
      if (variantName) {
        current.variants.push({
          variantName: String(variantName).trim(),
          optionValue: String(row[col.VARIACION_1_OPCION] ?? "").trim(),
          priceOverride: toNumber(row[col.VARIACION_PRECIO]),
          sku: normalizeSku(row[col.SKU]),
        });
      }
    } else if (current) {
      const variantName = row[col.VARIACION_1_NOMBRE];
      const optionValue = row[col.VARIACION_1_OPCION];
      if (variantName || optionValue) {
        current.variants.push({
          variantName: String(variantName ?? current.variants[0]?.variantName ?? "Opción").trim(),
          optionValue: String(optionValue ?? "").trim(),
          priceOverride: toNumber(row[col.VARIACION_PRECIO]),
          sku: normalizeSku(row[col.SKU]),
        });
      }
    }
  }

  if (current) products.push(current);
  return products;
}
