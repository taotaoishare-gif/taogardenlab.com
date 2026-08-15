/* Pick a field and its Chinese sibling together.
   `title` + `titleZh` -> { en, zh }, falling back to the English when no
   translation exists yet, so a half-translated entry degrades to bilingual-
   where-it-can rather than to a blank. */
export function bi(data: Record<string, any>, key: string) {
  const en = data[key] ?? '';
  const zh = data[`${key}Zh`];
  return { en, zh: zh ?? en };
}
