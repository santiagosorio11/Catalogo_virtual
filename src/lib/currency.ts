export function formatCOP(value: number): string {
  const rounded = Math.round(value);
  return `COP ${rounded.toLocaleString("es-CO")}`;
}
