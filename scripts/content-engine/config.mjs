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

  // ── Top-of-feed photo checker ─────────────────────────────────────────────
  // How many of an era's newest moments must carry a real photo (or a
  // recorded `photosReviewed` reason) — see checkers/top-of-feed-photo.mjs.
  topOfFeed: {
    count: 10,
  },

  // ── Image quality thresholds ─────────────────────────────────────────────
  image: {
    minWidth: 400, // px — below this reads as a junk thumbnail
    minHeight: 300,
    minBytes: 8 * 1024, // 8KB — below this is almost always a placeholder/spacer
    fetchTimeoutMs: 15000,
    concurrency: 4, // polite parallelism when probing image URLs (Wikimedia throttles hard)
    okContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'],
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
    // Reviewed 2026-08-24 for #1723: established news/entertainment/fashion
    // publishers, official organizations, and publisher-specific CDNs. Keep
    // generic multi-tenant CDNs off this list unless the tenant can be scoped.
    'i.abcnewsfe.com', 's.abcnews.com', 'cdn.abcotvs.com',
    'i.guim.co.uk', 'static.time.com', 'media.vanityfair.com',
    'assets.teenvogue.com', 'media.glamour.com', 'assets.newsweek.com',
    'media.cnn.com', 'image.cnbcfm.com', 'fortune.com',
    'media.nbcphiladelphia.com', 'media.nbcbayarea.com',
    'assets2.cbsnewsstatic.com', 'assets3.cbsnewsstatic.com',
    'sportshub.cbsistatic.com', 'images.foxtv.com', 'a57.foxnews.com',
    'media.npr.org', 'npr.brightspotcdn.com',
    'i.cbc.ca', 'www.rte.ie', 'images.wral.com',
    'neon.reviewjournal.com', 'www.deseret.com', 'www.inquirer.com',
    'archive.longislandpress.com', 'cdn.i-scmp.com',
    's.yimg.com', 'media.zenfs.com',
    'blogs-images.forbes.com', 'specials-images.forbesimg.com',
    'lede-admin.stereogum.com', 'deadline.com', 'wwd.com',
    'www.etonline.com', 'images.hellomagazine.com', 'graziamagazine.com',
    'imgix.bustle.com', 'images.complex.com',
    's2.r29static.com', 'static3.refinery29.com',
    'thefader-res.cloudinary.com', 'cdn.hercampus.com',
    'www.redcarpet-fashionawards.com', 'fashiongonerogue.com',
    'skift.com', 'petapixel.com', 'consequence.net',
    'www.wideopencountry.com', 'www.thelist.com', 'www.nickiswift.com',
    'hollywoodlife.com', 'headlineplanet.com', 'assets.purewow.com',
    'imagez.tmz.com', 'i.iheart.com',
    'jj-justjared-media.s3.amazonaws.com',
    'jj-justjared-media.s3.us-east-1.amazonaws.com',
    'jj-justjaredjr-media.s3.amazonaws.com',
    'jj-justjaredjr-media.s3.us-east-1.amazonaws.com',
    'cdn01.justjared.com',
    'a1.espncdn.com', 'img.mlbstatic.com', 'cdn.nba.com',
    'images2.minutemediacdn.com',
    'www.guinnessworldrecords.com', 'thewaltdisneycompany.com',
    'news.wwu.edu', 'wsjshop.com',
    'cloudfront-us-east-1.images.arcpublishing.com',
    'd3i6fh83elv35t.cloudfront.net',
    'wish-media.s3.us-east-2.amazonaws.com',
    // Our own Supabase storage bucket — owned infrastructure, not a
    // third-party hotlink, so it carries none of the "unvetted host" risk
    // this allowlist exists for (2026-08-24, issue #1968 hardening pass).
    'zpllkavmkkjnxpedhotv.supabase.co',
    // Reviewed 2026-08-26 for #1723 (second pass): dedicated single-tenant
    // hostnames (own subdomain/domain, not a shared multi-tenant CDN) for
    // publishers and archival fashion-ID sites already relied on repeatedly
    // elsewhere in this corpus as sourceUrl citations, not just images.
    'ra-grammy-media.ncp.consulting', // The Recording Academy's own press-media subdomain (NCP Consulting hosts their release PDFs/media at this exact host — verified via web search).
    'entertainmentnow.com', // Already cited corpus-wide with source_type: 'reputable_press'.
    'www.femestella.com', // Established entertainment/pop-culture outlet (Femestella Media).
    'www.shefinds.com', // SheFinds Media, founded 2004, established shopping/lifestyle outlet.
    'www.blogilates.com', // Cassey Ho's own site — primary source for her Popflex brand's Taylor Swift tie-in, already cited elsewhere in this corpus.
    'media.hollywoodlife.com', // hollywoodlife.com's own media subdomain — same publisher already trusted above.
    'www.thewrap.com', // Established Hollywood trade publication.
    'medias.spotern.com', // Spotern's own dedicated media subdomain (outfit/prop-ID catalog), already cited alongside Wikipedia in this corpus.
    'tayswiftstyle.wordpress.com', // Dedicated single-blog WordPress.com subdomain (not the shared wordpress.com/i0.wp.com CDN); cited 18x corpus-wide as a fashion-ID source.
    'taylorpictures.net', // Long-running, single-purpose Taylor Swift candid-photo archive; cited 8x corpus-wide.
    'stealherstyle.net', // Dedicated style-ID blog; cited 5x corpus-wide.
    'fashionsizzle.com', // Dedicated fashion-ID blog; cited 4x corpus-wide.
  ],

  // ── Scoped multi-tenant CDN allowlist (host + path prefix) ────────────────
  // Some legitimate publishers/photographers sit on a generic multi-tenant
  // CDN where the tenant identity lives in the URL PATH, not the hostname
  // (Google Cloud Storage buckets, Squarespace/Prismic/Format customer
  // sites). A bare hostname entry above would trust every other tenant on
  // that shared domain too, which is exactly what the "keep generic CDNs
  // off the allowlist" rule above exists to prevent. These entries scope
  // trust to one specific bucket/site instead. Checked in addition to
  // hostAllowlist, never a substitute for it. Reviewed 2026-08-26 for #1723.
  scopedHostAllowlist: [
    // Spotify Newsroom's own GCS-backed WordPress media bucket. Every image
    // seen under this prefix in the corpus is credited "Spotify Newsroom"
    // with a sourceUrl on newsroom.spotify.com.
    { host: 'storage.googleapis.com', pathPrefix: '/pr-newsroom-wp/' },
    // Beth Garrabrant's own Format portfolio — the credited photographer for
    // the official folklore album art; this is her site's unique Format ID.
    { host: 'format.creatorcdn.com', pathPrefix: '/9fcd0df5-9285-4916-8837-8946bbc00b90/' },
    // "Taylor Swift Style" — a long-running, press-cited fashion-ID archive
    // (see the-life-of-a-showgirl.mjs photo-pass note) — this is its unique
    // Squarespace site ID.
    { host: 'images.squarespace-cdn.com', pathPrefix: '/content/v1/6616cae0172b170a8dd0818d/' },
    // Birchbox's own Prismic CMS bucket (birchbox.com/magazine).
    { host: 'images.prismic.io', pathPrefix: '/birchbox/' },
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
    // Privacy-speculation screens (docs/content-ops/privacy-redlines.md).
    // Candidates, NOT findings: the corpus legitimately contains e.g. the
    // cancer diagnosis Taylor disclosed herself — an agent classifies each hit
    // against the redlines doc (Never-OK #3/#4: body/health and sexuality
    // speculation; #1/#2: home-location and security references).
    privacySpeculationTerms: [
      'pregnant', 'pregnancy', 'baby bump', 'expecting', 'diagnosis',
      'hospitalized', 'health scare', 'mental health', 'rehab',
      'sexuality', 'gaylor', 'closeted',
    ],
    locationPrivacyTerms: [
      'her house in', 'her home in', 'his house in', 'his home in',
      'townhouse', 'penthouse', 'estate in', 'compound in',
      'security detail', 'security team', 'bodyguard',
      // Widened 2026-07-20 after a LIVE miss. A published moment carried
      // "Security tightened around her Watch Hill estate" and "extra security
      // around the Watch Hill estate" — a security-arrangements redline
      // (Never-OK #2, absolute and untouched by the location relaxation) — and
      // the checker said nothing, because the list only held the exact noun
      // phrases 'security detail'/'security team'. The dangerous form is
      // security as a VERB or a change of state, not as a job title.
      'security tightened', 'extra security', 'security presence',
      'security around', 'stepped up security', 'security was increased',
      // Widened again 2026-07-20, same root cause as the line above: the
      // dangerous form is security described as an ACTIVITY, and there are
      // more ways to phrase that than the first pass imagined. Found by
      // reading a live caption ("while security stands watch outside") that
      // the list above sailed past.
      'security stands', 'security stood', 'security watching', 'guards posted',
      'security posted', 'security guarding', 'patrolled', 'security swept',
      // Forward-looking location (2026-07-20). These are CANDIDATES, not
      // findings, because the answer depends on the place name that follows:
      // "expected in the Bahamas" is L0 and fine, "expected at the Bowery
      // Hotel" is L2 speculation and is not. A regex cannot tell those apart;
      // the agent pass reads the matrix in privacy-redlines.md and decides.
      // Announced tour dates will trip these too and are legitimate — that is
      // exactly why this route never auto-accuses.
      'will be at', 'expected at', 'expected to attend', 'expected to arrive',
      'plans to stay', 'reportedly staying', 'is staying at', 'set to appear at',
      'spotted heading to', 'due in',
      // Travel specifics that are fine at region level and not below.
      'terminal', 'boarding', 'lands at', 'touches down at',
    ],
  },

  // ── Output ────────────────────────────────────────────────────────────────
  output: {
    findingsDir: 'scripts/content-engine/.findings', // per-run findings JSON (gitignored)
    reportsDir: 'docs/audits/engine', // committed run reports
    issueLabelPrefix: 'cie', // GitHub label namespace
  },
};
