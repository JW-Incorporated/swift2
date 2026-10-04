export type LegalPage = 'privacy' | 'terms' | 'support';

const PAGES: ReadonlySet<string> = new Set<LegalPage>(['privacy', 'terms', 'support']);

/** Maps a web URL or path to a legal page id, or null. Trailing slash, query and hash are ignored. */
export function legalPageForPath(input: string | null | undefined): LegalPage | null {
  if (!input) return null;
  let path: string;
  try {
    path = new URL(input, 'https://x.invalid').pathname;
  } catch {
    return null;
  }
  const seg = path.replace(/\/+$/, '').slice(1);
  return PAGES.has(seg) ? (seg as LegalPage) : null;
}
