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
      // photosReviewed (OPTIONAL): a one-line reason recording a DELIBERATE
      // no-photo editorial decision (privacy redline, no verifiable image,
      // etc.) — e.g. 'residence privacy redline (L1)'. Set this instead of
      // leaving `photos` empty with no explanation; the top-of-feed-photo
      // checker (content.top-of-feed-photo) otherwise flags every recent
      // photo-less page as P1, and this field tells it (and the next reader)
      // the gap was reviewed on purpose, not missed.
      // photosReviewed: 'residence privacy redline (L1) — no photo of the property',
      title: 'Butterfly jumpsuit at the VMAs',
      snippet: 'One-line preview of the look — a hook, not the article.',
      // TODO: No verifiable source exists for this placeholder record as-is.
      // Replace with a real source URL before converting to production seed data.
      sourceUrl: 'https://www.taylorswift.com',
      thumbnailUrl: null, // hotlink only; null if none
      // confidence (OPTIONAL): one of the 8 shared levels (official |
      // confirmed_interview | reputable_reporting | strong_fan_consensus |
      // plausible | clowning | disproven | joke_meme). Omit for a confirmed
      // fact (the default — no label). Anything below the confirmed tier
      // renders an UNMISSABLE "Rumor — unconfirmed" / "Reported — not
      // confirmed" banner naming the first source's outlet — use it when a
      // whole item rests on reporting nobody official has confirmed.
      // On a sub-confirmed item, the FIRST moment.sources entry must be the
      // outlet that reported the claim (never an image-credit/license
      // source) — the banner attributes to it by position.
      // confidence: 'reputable_reporting',
      // Optional Tier 1 detail shown when a user taps into this item:
      moment: {
        context: 'A few sentences of editorial context — still metadata, not a copied article.',
        sources: [{ outlet: 'TBD', url: 'https://www.taylorswift.com' }],
        photos: [{ url: 'https://www.taylorswift.com', credit: 'Getty Images' }],
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
        // rumors (OPTIONAL): attributed, dated press claims about this moment
        // that are NOT confirmed — they render in a visually distinct
        // "What's rumored" section, never woven into the confirmed narrative.
        // Every field except `note` is REQUIRED (the generator drops an
        // unattributed/undated entry; the validator makes that a hard error).
        // status: unconfirmed | partially_confirmed | confirmed | debunked —
        // keep resolved rumors on record with an honest status instead of
        // deleting them. NEVER fabricate; label estimates as estimates.
        // HARD BAN (2026-07-04 brief, same as theories): NO speculation
        // about sexuality, family, or identity — ever. A rumor entry is an
        // outlet-reported claim about a PUBLIC event/topic, in our words,
        // never the app's own speculation about someone's private life.
        // rumors: [
        //   {
        //     claim: 'What was reported, in our words, framed as a report (<=400).',
        //     reportedBy: 'Example Mag',
        //     reportedOn: '2026-07-02',
        //     status: 'unconfirmed',
        //     url: 'https://www.taylorswift.com',
        //     note: 'Optional context — an estimate caveat, what debunked it (<=400).',
        //   },
        // ],
      },
    },
  ],
};
