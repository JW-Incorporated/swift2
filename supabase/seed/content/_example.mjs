// TEMPLATE for the CONTENT track (Joey). Copy this to `<era-slug>.mjs` (e.g.
// `lover.mjs`) and fill in real dated items for that era. Files starting with
// "_" are ignored by the seed runner, so this template is never seeded.
//
// Rules (enforced by DB CHECK constraints):
//   - snippet: a short preview, NOT a full article body (≤400 chars).
//   - moment.context: extended context, still not a rehosted body (≤2000).
//   - all image URLs are HOTLINKS to the source — never rehosted.
//   - category is one of: sighting | fashion | relationship | tour | business | music | release
//
// Then run:  npm run db:seed:content
export default {
  eraSlug: 'lover',
  items: [
    {
      year: 2019,
      month: 8,
      // day (OPTIONAL, 1-31): add when the exact date is documented, for a
      // real "August 26, 2019" label instead of just "August 2019". Most
      // items are still month-only — omit rather than guess a day.
      // day: 26,
      category: 'fashion',
      // significance (OPTIONAL): 'defining' | 'notable' | omit (routine, the
      // default). An explicit judgment call, not inferred from how many
      // photos/sources you happen to have — see docs/content-ops/depth-
      // rubric.md "Significance" and docs/decisions.md 2026-07-18. 'defining'
      // always renders full-bleed hero and expects materially deeper content
      // (see the rubric); reserve it for genuinely life-defining events (a
      // wedding, an album release, a major breakup) — most items, including
      // most Active-tier ones, have no significance set at all.
      // significance: 'defining',
      title: 'Butterfly jumpsuit at the VMAs',
      snippet: 'One-line preview of the look — a hook, not the article.',
      sourceUrl: 'https://example.com/source-article',
      thumbnailUrl: null, // hotlink only; null if none
      // Optional Tier 1 detail shown when a user taps into this item:
      moment: {
        context: 'A few sentences of editorial context — still metadata, not a copied article.',
        sources: [{ outlet: 'Example Mag', url: 'https://example.com/source-article' }],
        photos: [{ url: 'https://example.com/photo.jpg', credit: 'Getty Images' }],
        // products (OPTIONAL, fashion moments): the exact garments worn, each
        // pointing at the retailer's own product-detail page. HARD RULES
        // (docs/decisions.md 2026-07-19): url is the DIRECT https product
        // page — never a search/category page, never guessed; verify it
        // resolves (HTTP 200) before committing. retailer is a bare lowercase
        // hostname (the future affiliate-routing key). Verified sold-out
        // items get inStock: false (rendered dimmed + labeled) — omit
        // inStock when purchasable. price is the display string, optional.
        // products: [
        //   {
        //     brand: 'Polo Ralph Lauren',
        //     item: 'Striped Silk-Blend Day Dress',
        //     retailer: 'ralphlauren.com',
        //     url: 'https://www.ralphlauren.com/...exact-product-page',
        //     price: '$319.99',
        //     inStock: false,
        //   },
        // ],
      },
    },
  ],
};
