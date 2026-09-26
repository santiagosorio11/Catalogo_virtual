/**
 * Normalizes product and category names to a single initial capital.
 * The first letter is capitalized even when the name starts with a number.
 */
export function normalizeCatalogName(value: string): string {
  const compact = value.trim().replace(/\s+/g, " ");
  if (!compact) return "";

  const lowercase = compact.toLocaleLowerCase("es-CO");
  return lowercase.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase("es-CO"));
}
