// Invented-attribution check for current-item copy (docs/decisions.md 2026-11-03
// "News post quality engine"): flags outlet-style attributions ("People
// reports", "per Variety", "according to the Ankler") whose outlet is not among
// the item's sources or fact attributions. Pure, zero I/O. "<Name> said/says/
// told" is NOT an outlet attribution: people say things.

import { outletLabel } from './outlet-label.ts';

// Local shape on purpose: current-item-writing.ts imports this file.
type AttributionSource = { name?: string; outletName?: string; url?: string };

const NEVER = new Set([
  'taylor', 'swift', 'taylor swift', 'her team', 'fans', 'swifties', 'sources', 'a source', 'insiders',
  'reports', 'it', 'he', 'she', 'they', 'we', 'this', 'that', 'the', 'her', 'his', 'their', 'fan',
  'one', 'some', 'many', 'others',
]);

const TOKEN = "(?:E!|[a-z]?[A-Z][A-Za-z0-9'’.-]*)";
const NAME = '((?:The\\s+)?' + TOKEN + '(?:\\s+(?:&\\s+)?' + TOKEN + '){0,3})';
const PATTERNS = [
  new RegExp(`\\b[Pp]er\\s+${NAME}`, 'g'),
  new RegExp(`\\b[Aa]ccording to\\s+(?:(?:a|an|the)\\s+)?${NAME}`, 'g'),
  new RegExp(`${NAME}(?:'s|’s)?\\s+(?:report|reports|reported)\\b`, 'g'),
  new RegExp(`${NAME}\\s+(?:wrote|published)\\b`, 'g'),
];

/** Lower-case, drop a leading "the", a .com/.net/.org suffix and punctuation; collapse spaces. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^the\s+/, '')
    .replace(/\.(?:com|net|org)$/, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hostStem(url: string): string | null {
  try {
    const parts = new URL(url).hostname.replace(/^www\./, '').split('.');
    if (parts.length > 1) parts.pop();
    return parts.join('.');
  } catch {
    return null;
  }
}

/** Lower-cased outlet names an attribution may use: source names, URL host stems, outletLabel()s, fact attributions. */
export function allowedOutlets(
  sources: readonly AttributionSource[],
  factAttributions: readonly string[] = [],
): string[] {
  const out = new Set<string>();
  const add = (value: string | null | undefined) => {
    const v = value?.trim().toLowerCase();
    if (v && v !== 'source') out.add(v);
  };
  for (const source of sources) {
    add(source.name);
    add(source.outletName);
    if (source.url?.trim()) {
      add(hostStem(source.url));
      add(outletLabel({ name: source.name, url: source.url }));
    }
  }
  for (const attribution of factAttributions) add(attribution);
  return [...out];
}

/** True when `name` equals an allowed entry, or one contains the other as whole words (People vs People.com). */
function isAllowed(name: string, allowed: readonly string[]): boolean {
  const n = normalize(name);
  const squashed = n.replace(/ /g, '');
  return allowed.some((entry) => {
    const a = normalize(entry);
    if (!a) return false;
    if (a === n || a.replace(/ /g, '') === squashed) return true;
    return ` ${n} `.includes(` ${a} `) || ` ${a} `.includes(` ${n} `);
  });
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when a fact claim credits `n` as a source (citing / per / according to / by / from X, or X report/says/wrote), not merely mentions it. */
function creditedInClaims(n: string, claimText: string): boolean {
  const name = escapeForRegExp(n);
  const before = new RegExp(` (?:citing|per|according to|by|from|in) (?:a |an |the |\\d{4} )*${name} `);
  const after = new RegExp(` ${name} (?:s )?(?:report|reports|reported|says|said|wrote|story|article|piece|interview|retrospective) `);
  return before.test(claimText) || after.test(claimText);
}

/** Outlet-style attributions in `body` whose outlet is not allowed; first-seen order, de-duplicated case-insensitively. A name the item's own fact claims spell out ("a 2024 Page Six report", "a retrospective by Tom Breihan") is grounded, not invented. */
export function unknownAttributions(body: string, allowed: readonly string[], factClaims: readonly string[] = []): string[] {
  const claimText = ` ${factClaims.map(normalize).join(' ')} `;
  const hits: { index: number; name: string }[] = [];
  for (const re of PATTERNS) {
    for (const m of body.matchAll(re)) {
      const raw = m[1];
      if (raw === undefined || m.index === undefined) continue;
      // a sentence-final period rides on the last token ("People.com." -> "People.com"); a possessive is not part of the name
      const name = raw.replace(/\.$/, '').replace(/(?:'s|’s)$/, '').trim();
      hits.push({ index: m.index + m[0].indexOf(raw), name });
    }
  }
  hits.sort((x, y) => x.index - y.index);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { name } of hits) {
    const lower = name.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    if (NEVER.has(lower) || NEVER.has(lower.replace(/^the\s+/, ''))) continue;
    if (isAllowed(name, allowed)) continue;
    const n = normalize(name);
    if (n && creditedInClaims(n, claimText)) continue;
    out.push(name);
  }
  return out;
}
