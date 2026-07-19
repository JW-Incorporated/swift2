// Product-gap checker (deterministic, NO NETWORK).
//
// Shoppable-links groundwork (feat/shoppable-links, 2026-07-19): fashion
// moments can carry `moment.products` — the exact garments with direct
// retailer product pages, rendered as "Shop the look" and wired for a later
// affiliate flip via buildShopUrl(). This checker turns coverage into a
// prioritized queue instead of a vibe, exactly like photo-sparsity does for
// photos: a fashion moment whose prose NAMES specific branded garments
// ("a Schiaparelli gown", "Polo Ralph Lauren dress") but carries no products
// is a page a fan will land on wanting the link we don't have.
//
// The garment heuristic is deliberately conservative: a run of Capitalized
// words (the brand) within a few words before a garment noun. Sentence-lead
// articles and Taylor herself are stop-listed so "The dress" or "Taylor's
// boots" never read as a brand. False negatives are acceptable (the queue
// just grows later); a flood of false positives is not.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.product-gap';

// Garment/accessory nouns worth a shop link when a brand precedes them.
const GARMENTS =
  'dress|shirtdress|gown|jumpsuit|bodysuit|romper|corset|skirt|blazer|jacket|coat|trench|cape|sweater|cardigan|knit|blouse|shirt|top|tee|pants|trousers|shorts|jeans|tights|boots|booties|sandals|heels|pumps|stilettos|loafers|flats|sneakers|bag|handbag|clutch|purse|watch|earrings|necklace|choker|bracelet|ring|sunglasses|hat|fedora|beret|scarf|gloves';

// Capitalized tokens that are NOT a brand: sentence-lead articles/pronouns,
// Taylor/related proper nouns, months, and common sentence-openers seen in
// the corpus. Lowercase for comparison.
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'her',
  'his',
  'their',
  'its',
  'this',
  'that',
  'these',
  'those',
  'one',
  'taylor',
  'swift',
  'swifts',
  'travis',
  'kelce',
  'she',
  'he',
  'they',
  'it',
  'in',
  'on',
  'at',
  'with',
  'and',
  'but',
  'for',
  'from',
  'after',
  'before',
  'while',
  'when',
  'wearing',
  'wore',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'eras',
  'tour',
  'grammys',
  'grammy',
  'vmas',
  'amas',
  'met',
  'gala',
  'super',
  'bowl',
  'new',
  'york',
  'nyc',
  'los',
  'angeles',
  'london',
  'paris',
]);

// A run of 1-4 Capitalized words (optionally possessive), then up to three
// lowercase descriptor words ("caramel-brown", "silk-blend", "custom"), then
// a garment noun. Case-sensitive on purpose — capitalization IS the signal.
const BRAND_GARMENT_RE = new RegExp(
  String.raw`\b((?:[A-Z][\w&.'’-]*\s+){0,3}[A-Z][\w&.'’-]*)(?:['’]s)?((?:\s+[a-z][\w'’-]*){0,3})\s+(${GARMENTS})\b`,
  'g',
);

/**
 * Branded-garment mentions in one text: each match's capitalized run must
 * contain at least one non-stopword token to count as a brand. Exported for
 * the unit test.
 */
export function brandedGarmentMentions(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(BRAND_GARMENT_RE)) {
    const tokens = m[1].split(/\s+/).map((t) => t.replace(/[^\w&'’.-]/g, ''));
    const brandTokens = tokens.filter(
      (t) => t && !STOPWORDS.has(t.toLowerCase().replace(/['’]s?$/, '')),
    );
    if (brandTokens.length === 0) continue;
    out.push(`${brandTokens.join(' ')} ${m[3]}`);
  }
  return out;
}

export async function check(items) {
  const findings = [];
  for (const it of items) {
    if (it.type !== 'moment') continue;
    if (it.category !== 'fashion') continue;
    if (Array.isArray(it.raw?.moment?.products) && it.raw.moment.products.length > 0) continue;
    const mentions = [
      ...new Set([
        ...brandedGarmentMentions(it.texts.snippet),
        ...brandedGarmentMentions(it.texts.context),
      ]),
    ];
    if (mentions.length === 0) continue;
    findings.push(
      makeFinding({
        checker: id,
        severity: 'P3',
        title: `Fashion moment names ${mentions.length} branded garment(s) but has no shop links`,
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `The prose names specific shoppable garments (${mentions.join('; ')}) but the moment carries no \`moment.products\`. Fans landing on a named-garment fashion page expect the direct link — and each missing row is unrealized affiliate inventory once the buildShopUrl() flip happens.`,
        suggestedFix:
          'Add `moment.products` rows ({ brand, item, retailer, url, price?, inStock? }) with the exact retailer product-detail pages — verify each URL resolves (HTTP 200), never a search page, and mark sold-out items inStock: false. See the engagement-look pilot in tortured-poets.mjs.',
        confidence: 0.55,
      }),
    );
  }
  return findings;
}
