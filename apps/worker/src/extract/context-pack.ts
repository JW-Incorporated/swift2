// Pass B context pack: a small, deterministic, character-capped bundle of
// vault context the writer may draw on and cite (ids c1, c2, ...).

import { overlapScore, SAME_STORY_OVERLAP } from './dedupe-shortlist';

export const CONTEXT_PACK_MAX_CHARS = 6_000;
export const MAX_CONTEXT_MOMENTS = 5;
export const MAX_PRIOR_ITEMS = 3;
const MAX_ITEM_CHARS = 700;

export interface ContextMoment {
  title: string;
  summary: string;
  tags?: readonly string[];
  entities?: readonly string[];
}

export interface PriorItemContext {
  headline: string;
  lead: string;
  id?: string;
  mergedInto?: string | null;
  url?: string | null;
}

export interface ContextPackInput {
  eraName: string;
  eraSummary: string;
  headline: string;
  entities: readonly string[];
  /** Moments of the item's era; the pack keeps the best overlapping five. */
  moments: readonly ContextMoment[];
  /** Prior related current items, newest relevance first; the pack keeps three. */
  priorItems: readonly PriorItemContext[];
  /** The current item's own id, merge target and canonical source URL, so its own earlier
   * entries are kept out of priorItems. The caller (context-loader.ts loadPriorItems /
   * v2-stage.ts composeV2Item) must pass these and the matching PriorItemContext fields for
   * the id/merge/url checks to apply; the headline check works without them. */
  itemId?: string;
  mergedInto?: string | null;
  url?: string | null;
}

export interface ContextPackItem {
  id: string;
  kind: 'era' | 'moment' | 'prior';
  text: string;
}

export interface ContextPack {
  items: ContextPackItem[];
  /** Prompt-ready rendering, one `[id] text` line per item. */
  text: string;
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'from', 'have', 'into', 'just', 'more', 'over',
  'said', 'says', 'that', 'their', 'them', 'then', 'this', 'with', 'will', 'your',
  'taylor', 'swift',
]);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? [])
    .map((w) => w.replace(/'s$/, ''))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

function canonicalUrl(urlStr: string | null | undefined): string {
  if (!urlStr) return '';
  try {
    const url = new URL(urlStr);
    url.search = '';
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.pathname.endsWith('/') && url.pathname.length > 1) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return urlStr.trim();
  }
}

/** True when `prior` is the current story itself (same id, a merge either way, same canonical
 * URL, or a headline at or above SAME_STORY_OVERLAP), which would make the writer repeat itself. */
export function isSameStory(input: ContextPackInput, prior: PriorItemContext): boolean {
  if (input.itemId && prior.id === input.itemId) return true;
  if (input.itemId && prior.mergedInto === input.itemId) return true;
  if (prior.id && input.mergedInto === prior.id) return true;
  if (prior.url && input.url) {
    if (canonicalUrl(prior.url) === canonicalUrl(input.url)) return true;
  }
  if (overlapScore(prior.headline, input.headline) >= SAME_STORY_OVERLAP) return true;
  return false;
}

function oneLine(text: string, max = MAX_ITEM_CHARS): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function buildContextPack(input: ContextPackInput): ContextPack {
  const itemWords = new Set([...words(input.headline), ...input.entities.flatMap(words)]);

  const scored = input.moments
    .map((moment, index) => {
      const momentWords = new Set([
        ...words(moment.title),
        ...(moment.tags ?? []).flatMap(words),
        ...(moment.entities ?? []).flatMap(words),
      ]);
      let score = 0;
      for (const w of momentWords) if (itemWords.has(w)) score++;
      return { moment, index, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_CONTEXT_MOMENTS);

  const drafts: Omit<ContextPackItem, 'id'>[] = [];
  const era = oneLine(`${input.eraName}: ${input.eraSummary}`);
  if (input.eraName.trim() && input.eraSummary.trim()) drafts.push({ kind: 'era', text: era });
  for (const { moment } of scored) {
    drafts.push({ kind: 'moment', text: oneLine(`${moment.title} — ${moment.summary}`) });
  }
  const filteredPriors = input.priorItems.filter((prior) => !isSameStory(input, prior));
  for (const prior of filteredPriors.slice(0, MAX_PRIOR_ITEMS)) {
    if (!prior.headline.trim()) continue;
    drafts.push({ kind: 'prior', text: oneLine(`Earlier on our feed: ${prior.headline} — ${prior.lead}`) });
  }

  const items: ContextPackItem[] = [];
  let used = 0;
  for (const draft of drafts) {
    const id = `c${items.length + 1}`;
    const cost = id.length + draft.text.length + 4;
    if (used + cost > CONTEXT_PACK_MAX_CHARS) break;
    used += cost;
    items.push({ id, ...draft });
  }

  return { items, text: items.map((i) => `[${i.id}] ${i.text}`).join('\n') };
}
