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

// Build a pagination link that keeps the active filters.
export function buildPageHref(
  basePath: string,
  values: Record<string, string | undefined>,
  page: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}
