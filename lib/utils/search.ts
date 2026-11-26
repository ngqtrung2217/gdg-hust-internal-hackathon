// Normalise a search box value and keep it short enough for a URL and an
// ilike pattern.
export function searchTerm(value: string | undefined) {
  return (value ?? "").trim().slice(0, 80);
}

// Quote-safe pattern for PostgREST `.or('col.ilike."%term%"')` filters.
export function ilikePattern(term: string) {
  return `%${term.replace(/[\\"]/g, "")}%`;
}

// Case-insensitive match for data that is already in memory (an RPC result).
export function matchesTerm(
  term: string,
  ...fields: (string | null | undefined)[]
) {
  if (!term) return true;
  const needle = term.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}
