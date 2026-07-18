// Deterministic, free, always-available fallback classifier. Runs whenever
// no OPENAI_API_KEY is configured or the daily cap is hit — the pipeline
// stays fully functional with zero LLM calls (degraded quality, not
// degraded availability, per docs/decisions.md 2026-07-18).

import { NEWS_CATEGORIES, type NewsCategory } from '@swift2/shared/news';

export interface ClassifyResult {
  category: NewsCategory;
  headline: string;
  summary: string;
  importance: number;
}

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  music: ['song', 'album', 'single', 'track', 'lyrics', 'grammy', 'billboard chart'],
  tour: ['tour', 'eras tour', 'concert', 'stadium', 'setlist', 'surprise song'],
  fashion: ['dress', 'gown', 'outfit', 'style', 'wore', 'look', 'red carpet'],
  relationship: ['travis kelce', 'kelce', 'wedding', 'engaged', 'boyfriend', 'dating', 'newlywed'],
  sighting: ['spotted', 'seen', 'sighting', 'photographed', 'appearance'],
  business: ['republic records', 'umg', 'trademark', 'deal', 'contract', 'net worth', 'permit'],
  release: ["taylor's version", 'taylors version', 're-recording', 'rerelease', 'vault track'],
};

/** category doubles as the default when no keyword matches — most generic "something happened" bucket. */
const DEFAULT_CATEGORY: NewsCategory = 'sighting';

export function classifyByKeywords(title: string, snippet: string): ClassifyResult {
  const haystack = `${title} ${snippet}`.toLowerCase();
  let best: NewsCategory = DEFAULT_CATEGORY;
  let bestScore = 0;
  for (const category of NEWS_CATEGORIES) {
    const score = CATEGORY_KEYWORDS[category].filter((k) => haystack.includes(k)).length;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return {
    category: best,
    headline: title.slice(0, 100),
    summary: (snippet || title).slice(0, 300),
    // No LLM judgment available — a flat, unopinionated default rather than a guess.
    importance: bestScore > 0 ? 5 : 3,
  };
}
