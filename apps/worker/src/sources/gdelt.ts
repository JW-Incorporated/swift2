import type { NormalizedNewsItem } from '@swift2/shared/news';

const GDELT_DOCUMENT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_QUERY = '"Taylor Swift"';
const MAX_ITEMS = 20;

interface GdeltArticle {
  title?: unknown;
  url?: unknown;
  seendate?: unknown;
}

function toIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{8}T\d{6}Z$/.test(value)) return undefined;

  const isoDate = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  return Number.isNaN(Date.parse(isoDate)) ? undefined : isoDate;
}

function normalizeArticle(article: GdeltArticle): NormalizedNewsItem | undefined {
  if (typeof article.title !== 'string' || typeof article.url !== 'string') return undefined;
  const publishedAt = toIsoDate(article.seendate);
  if (!publishedAt) return undefined;

  return {
    externalId: article.url,
    url: article.url,
    title: article.title,
    snippet: '',
    publishedAt,
  };
}

export async function fetchGdeltTaylorSwift(
  fetchImpl: typeof fetch,
): Promise<NormalizedNewsItem[]> {
  const params = new URLSearchParams({
    query: GDELT_QUERY,
    mode: 'artlist',
    format: 'json',
    maxrecords: String(MAX_ITEMS),
  });
  const response = await fetchImpl(`${GDELT_DOCUMENT_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`GDELT document query failed (${response.status})`);
  }

  const body = (await response.json()) as { articles?: GdeltArticle[] };
  return (body.articles ?? [])
    .slice(0, MAX_ITEMS)
    .map(normalizeArticle)
    .filter((article): article is NormalizedNewsItem => article !== undefined);
}
