
export function parseNumericItemId(itemId: string | number): number | null {
  if (typeof itemId === "number") return itemId;
  if (typeof itemId === "string") {
    const parsed = parseInt(itemId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}
