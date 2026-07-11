// Content Integrity Engine (CIE) — configuration.
// Central knobs: what's high-visibility, image-quality thresholds, and the
// image-host reputation allowlist (the near-term first line of safety defense
// for a hotlink-based app). No secrets here — the engine is read-only tooling.

export const CONFIG = {
  // ── Visibility / recency tiering ──────────────────────────────────────────
  // Higher score => stricter scrutiny (multi-source verification, independent
  // corroboration, tone review, strict image checks). See lib/visibility.mjs.
  visibility: {
    // Eras whose content is "latest news" — casual wording here is highest-risk.
    latestNewsEras: ['the-life-of-a-showgirl', 'tortured-poets'],
    // Category weights (marquee life/tour/music events carry more reach).
    categoryWeight: {
      relationship: 3,
      music: 2,
      release: 2,
      tour: 2,
      business: 2,
      fashion: 1,
      sighting: 1,
    },
    // Title/keyword hooks that mark a marquee moment regardless of category.
    marqueeHooks: [
      'engage', 'wedding', 'marry', 'married', 'proposal', 'divorce',
      'album', 'no. 1', 'number one', 'grammy', 'super bowl', 'record',
      'billionaire', 'death', 'died', 'lawsuit', 'masters',
    ],
    // Score at/above this = "high" tier (max scrutiny).
    highTierThreshold: 5,
  },

  // ── Image quality thresholds ─────────────────────────────────────────────
  image: {
    minWidth: 400, // px — below this reads as a junk thumbnail
    minHeight: 300,
    minBytes: 8 * 1024, // 8KB — below this is almost always a placeholder/spacer
    fetchTimeoutMs: 15000,
    concurrency: 4, // polite parallelism when probing image URLs (Wikimedia throttles hard)
    okContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  },

  // ── Image-host reputation (near-term CSAM/junk mitigation) ────────────────
  // Hotlinked images from these hosts are considered reputable (press, official,
  // encyclopedic, licensed CDNs). Anything OFF this list is flagged for review —
  // not because it's necessarily bad, but because an unvetted host is where
  // both junk and genuinely-unwanted content would enter a hotlink-based app.
  hostAllowlist: [
    'upload.wikimedia.org', 'commons.wikimedia.org',
    'i.ytimg.com', 'img.youtube.com',
    'billboard.com', 'www.billboard.com',
    'rollingstone.com', 'www.rollingstone.com',
    'variety.com', 'www.variety.com',
    'hollywoodreporter.com', 'www.hollywoodreporter.com',
    'people.com', 'www.people.com',
    'vogue.com', 'www.vogue.com',
    'gettyimages.com', 'media.gettyimages.com',
    'eonline.com', 'www.eonline.com', 'akns-images.eonline.com',
    'marieclaire.com', 'www.marieclaire.com',
    'cms.futurecdn.net', 'cdn.mos.cms.futurecdn.net',
    'townsquare.media', 'townsquare.media',
    'nme.com', 'www.nme.com',
    'time.com', 'api.time.com',
    'cbsnews.com', 'www.cbsnews.com', 'assets1.cbsnewsstatic.com',
    'forbes.com', 'www.forbes.com', 'imageio.forbes.com',
    'apnews.com', 'dims.apnews.com',
    'today.com', 'media-cldnry.s-nbcnews.com',
  ],

  // ── Text safety pre-filters (deterministic screens that route to review) ──
  // These do NOT judge on their own — a hit narrows the set an agent then
  // classifies (avoids false accusations while guaranteeing nothing is missed).
  safety: {
    sexualizationTerms: [
      'nude', 'nudes', 'naked', 'topless', 'sex tape', 'sextape', 'leaked photo',
      'leaked photos', 'leaked pics', 'upskirt', 'nip slip', 'nipslip',
      'onlyfans', 'explicit photo', 'intimate photos', 'bikini body', 'cleavage',
      'revealing', 'thirst trap',
    ],
    // A separate, absolute screen. Any hit is a P0 escalation, never a silent
    // pass — routed to human review, NOT auto-classified by a general model.
    illegalTerms: ['child', 'minor', 'underage', 'teen ', 'preteen'],
  },

  // ── Output ────────────────────────────────────────────────────────────────
  output: {
    findingsDir: 'scripts/content-engine/.findings', // per-run findings JSON (gitignored)
    reportsDir: 'docs/audits/engine', // committed run reports
    issueLabelPrefix: 'cie', // GitHub label namespace
  },
};
