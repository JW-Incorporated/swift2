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
      category: 'fashion',
      title: 'Butterfly jumpsuit at the VMAs',
      snippet: 'One-line preview of the look — a hook, not the article.',
      sourceUrl: 'https://example.com/source-article',
      thumbnailUrl: null, // hotlink only; null if none
      // Optional Tier 1 detail shown when a user taps into this item:
      moment: {
        context: 'A few sentences of editorial context — still metadata, not a copied article.',
        sources: [{ outlet: 'Example Mag', url: 'https://example.com/source-article' }],
        photos: [{ url: 'https://example.com/photo.jpg', credit: 'Getty Images' }],
      },
    },
  ],
};
