/** Compare keyboard punctuation without changing canonical card names. */
export function normalizeCardNameSearch(value: string): string {
  return value.replace(/[\u2018\u2019]/g, "'").toLowerCase();
}

export function cardNameSuggestions(
  names: readonly string[],
  search: string,
  selected = '',
  excluded = '',
): string[] {
  const query = normalizeCardNameSearch(search);
  const matches = (name: string) =>
    name !== excluded && normalizeCardNameSearch(name).includes(query);
  const results = selected && matches(selected) ? [selected] : [];
  if (query.length < 2) return results;

  for (const name of names) {
    if (results.length >= 100) break;
    if (name !== selected && matches(name)) results.push(name);
  }
  return results;
}
