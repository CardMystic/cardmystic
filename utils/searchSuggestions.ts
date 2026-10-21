/** Match all typed words locally; put whole-phrase prefix matches first. */
export function searchSuggestions(
  queries: readonly string[],
  input: string,
  limit = 8,
): string[] {
  const query = input.trim().toLowerCase();
  if (query.length < 2) return [];
  const words = query.split(/\s+/);
  return [...new Set(queries)]
    .filter(
      (item) =>
        item.toLowerCase() !== query &&
        words.every((word) => item.toLowerCase().includes(word)),
    )
    .sort(
      (a, b) =>
        Number(b.toLowerCase().startsWith(query)) -
        Number(a.toLowerCase().startsWith(query)),
    )
    .slice(0, limit);
}
