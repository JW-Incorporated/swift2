/** Canonicalize only single-leading-slash app paths; absolute and protocol-relative URLs pass through untouched. */
export function resolveAppUrl(path: string, origin: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? `${origin}${path}` : path;
}
