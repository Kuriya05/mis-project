export const MAX_TAGS_PER_QUESTION = 5;
export const MAX_TAG_LENGTH = 30;

/** Same rule as the create-question form: no leading '#', whitespace becomes '-'. */
export function normalizeTagName(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/\s+/g, '-').slice(0, MAX_TAG_LENGTH);
}

/** Normalised, non-empty and unique regardless of letter case (first spelling wins). */
export function normalizeTagNames(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of raw) {
    const name = normalizeTagName(value);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return names;
}
