const IDENTIFYING_QUERY_KEYS = new Set([
  'v',
  'id',
  'p',
  'story',
  'article',
  'a',
  'sid',
  'newsid',
  'storyid',
  'itemid',
]);

export function normalizedOutletHost(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    let host = new URL(raw).hostname.toLocaleLowerCase('en-US');
    while (/^(?:www|amp|m|mobile)\./.test(host)) host = host.replace(/^[^.]+\./, '');
    return host || undefined;
  } catch {
    return undefined;
  }
}

/** Canonical article identity: stable host/path plus sorted identifying parameters only. */
export function canonicalArticleUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    const host = normalizedOutletHost(raw);
    if (!host) return undefined;
    let path = url.pathname.replace(/\/+$/, '').replace(/\/(?:amp|amp\/index\.html)$/i, '');
    path = path.replace(/\.amp(?:\.html)?$/i, '.html');
    const identifying = [...url.searchParams]
      .filter(([key]) => IDENTIFYING_QUERY_KEYS.has(key.toLocaleLowerCase('en-US')))
      .map(([key, value]): [string, string] => [key.toLocaleLowerCase('en-US'), value])
      .sort(([aKey, aValue], [bKey, bValue]) =>
        aKey.localeCompare(bKey) || aValue.localeCompare(bValue),
      );
    const query = new URLSearchParams(identifying).toString();
    return `${host}${path || '/'}${query ? `?${query}` : ''}`;
  } catch {
    return undefined;
  }
}

function termCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const words = text.toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]+/gu) ?? [];
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
}

/** Cosine similarity for full article text; short anchors cannot create a syndication match. */
export function articleTextSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  const left = termCounts(a);
  const right = termCounts(b);
  if ([...left.values()].reduce((sum, count) => sum + count, 0) < 20 ||
      [...right.values()].reduce((sum, count) => sum + count, 0) < 20) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (const [word, count] of left) {
    dot += count * (right.get(word) ?? 0);
    leftMagnitude += count ** 2;
  }
  for (const count of right.values()) rightMagnitude += count ** 2;
  return dot / Math.sqrt(leftMagnitude * rightMagnitude);
}
