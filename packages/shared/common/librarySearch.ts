/** Index once per library snapshot; avoid normalizing every field on each keystroke. */
export const normalizeLibraryQuery = (text?: string | null) => (text ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
export const buildLibrarySearchIndex = (rows: Iterable<{ key: string; fields: Array<string | null | undefined> }>) => {
  const index = new Map<string, string>()
  for (const row of rows) index.set(row.key, row.fields.map(normalizeLibraryQuery).join('\u0000'))
  return index
}
export const searchLibraryIndex = <T extends { key: string }>(rows: T[], index: Map<string, string>, query: string): T[] => {
  const text = normalizeLibraryQuery(query)
  return text ? rows.filter((row) => index.get(row.key)?.includes(text)) : rows
}
