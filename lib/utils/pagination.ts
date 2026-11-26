// Resolve a 1-based page number from a query string and clamp it to the
// available pages so a stale ?page= cannot render an empty table.
export function resolvePage(
  value: string | undefined,
  totalItems: number,
  pageSize: number,
) {
  const parsed = Number.parseInt(value ?? "1", 10);
  const requested = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return { page: Math.min(requested, totalPages), totalPages };
}
