// Fashion-products checker (deterministic, NO NETWORK).
//
// Feeds the Stylist's queue: fashion moments that name a specific, plausibly
// BUYABLE garment (a known brand + a garment noun) but carry no
// `moment.products` shopping links. "Fashion category + no products" alone
// over-flags badly (founder pushback 2026-07-19): half of fashion moments
// aren't shoppable at all — bespoke jewelry (the engagement ring), haute
// couture one-offs, custom stage wardrobe. Flagging those would burn Stylist
// runs on links that cannot exist. So this requires positive evidence of
// buyability and excludes explicit one-off language.
//
// The brand list is empirical — compiled from the seeds' own fashion coverage
// (grep 2026-07-19) — not aspirational. Extend it as new brands enter the
// corpus; a missing brand means a missed flag (fine), never a false one.
import { makeFinding } from '../lib/finding.mjs';

export const id = 'content.fashion-products';

const BRANDS = [
  'Louboutin', 'Versace', 'Etro', 'Oscar de la Renta', 'Roberto Cavalli',
  'Dior', 'Gucci', 'David Koma', 'Zimmermann', 'Schiaparelli', 'Free People',
  'Louis Vuitton', 'Jimmy Choo', 'Balmain', 'Saint Laurent', 'Elie Saab',
  'Reformation', 'Ralph Lauren', 'Cartier', 'Miu Miu', 'Frankie Shop',
  'Khaite', 'Stella McCartney', 'Prada', 'The Row', 'Stuart Weitzman',
  'New Balance', 'Gildan', 'Doen', 'Dôen', 'Area', 'Gabriela Hearst',
  'Chanel', 'Aupen', 'Madewell', 'Keds', 'Sam Edelman', 'Tory Burch',
];

// Buyable garment nouns. Deliberately excludes 'ring' and 'band' — bespoke
// jewelry (the engagement ring) is the canonical un-shoppable fashion moment.
const GARMENTS = [
  'dress', 'gown', 'skirt', 'blouse', 'shirt', 'tee', 't-shirt', 'top',
  'sweater', 'cardigan', 'jacket', 'bomber', 'blazer', 'coat', 'trench',
  'bodysuit', 'corset', 'jumpsuit', 'romper', 'shorts', 'jeans', 'trousers',
  'pants', 'tights', 'boots', 'sandals', 'loafers', 'heels', 'pumps',
  'sneakers', 'flats', 'bag', 'purse', 'clutch', 'watch', 'sunglasses',
  'earrings', 'necklace', 'bracelet', 'scarf', 'hat', 'beret', 'gloves',
];

// One-off language: a garment described this way has no product page. Plain
// `custom` and `atelier` are included deliberately — in this corpus "custom
// Etro gown" / "Atelier Versace" always means made-for-her (verified on the
// 2026-07-19 tuning run). The trade-off is accepted: a moment mixing one
// custom piece with buyable accessories gets skipped (under-flagging is fine;
// wasting Stylist runs on unbuyable couture is not).
const ONE_OFF = /\b(haute couture|couture|bespoke|custom|atelier|one[- ]of[- ]a[- ]kind)\b/i;

const GARMENT_RE = new RegExp(`\\b(${GARMENTS.join('|')})s?\\b`, 'i');

export async function check(items) {
  const findings = [];
  for (const it of items) {
    if (it.type !== 'moment') continue;
    // NOT gated on category === 'fashion' any more (2026-07-20). It was, and
    // that silently hid 31 of the 74 eligible moments — 42% — because what a
    // moment is CATEGORISED as says nothing about whether it describes clothes
    // anyone can buy. Wyatt found it from the reader's side: "A pink mini dress
    // for a Saturday-night dinner date" is category 'sighting', names a Balmain
    // minidress, Louboutin sandals, an Aspinal bag and a Cartier necklace with
    // prices, and could never be queued no matter how often the Stylist ran.
    // Award nights, tour openers and red-carpet appearances are the same story.
    //
    // Precision never came from the category anyway — it comes from the three
    // tests below (named brand + buyable garment noun + not a one-off). That
    // is what answered the 2026-07-19 over-flagging pushback, and it is
    // untouched. Category now only ranks.
    if ((it.raw?.moment?.products ?? []).length > 0) continue;

    const text = [it.title, it.texts?.snippet, it.texts?.context].filter(Boolean).join('\n');
    const brand = BRANDS.find((b) => text.includes(b));
    if (!brand) continue; // no named brand → nothing to link
    if (!GARMENT_RE.test(text)) continue; // no buyable garment noun
    if (ONE_OFF.test(text)) continue; // couture/bespoke → no product page exists

    findings.push(
      makeFinding({
        checker: id,
        severity: 'P3',
        title: 'Fashion moment names a buyable garment but has no shop links',
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `This ${it.category} moment names ${brand} and a specific garment but carries no \`moment.products\` entries. Fans should get a direct link to the exact product page (never a search page), via the buildShopUrl seam so it can become an affiliate link later with no content edits.`,
        suggestedFix:
          'Route to the Stylist: find the exact retailer product page for each named garment, verify it returns HTTP 200 and is a real product page, and add { brand, item, retailer, url, price, inStock } to moment.products. Sold out → inStock: false. No real product page → skip that garment.',
        // Category no longer gates, it ranks. A moment filed as 'fashion' is
        // still the most likely to be all-buyable, so it keeps the old score
        // and stays at the head of the Stylist's queue; everything else is a
        // genuine but slightly weaker candidate rather than an invisible one.
        confidence: it.category === 'fashion' ? 0.6 : 0.45,
      }),
    );
  }
  return findings;
}
