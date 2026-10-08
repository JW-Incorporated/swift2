// GENERATED FILE — do not hand-edit. Source of truth:
// packages/shared/src/source-tiers.ts. Regenerate with
// `node scripts/sync-source-tiers.mjs` (or `npm run sync:content`);
// `npm run check:generated` fails CI if this drifts.

export const OFFICIAL_DOMAINS = new Set(["taylorswift.com"]);

export const ESTABLISHED_DOMAINS = new Set([
  "billboard.com",
  "variety.com",
  "rollingstone.com",
  "hollywoodreporter.com",
  "wwd.com",
  "deadline.com",
  "stereogum.com",
  "theguardian.com",
  "bbc.co.uk",
  "bbc.com",
  "nytimes.com",
  "people.com",
  "etonline.com",
  "vogue.com",
  "elle.com",
  "harpersbazaar.com",
  "tennessean.com",
  "kansascity.com",
  "pitchfork.com",
  "forbes.com",
  "nbcnews.com",
  "cbsnews.com",
  "today.com",
  "apnews.com",
  "reuters.com",
  "usatoday.com",
  "snopes.com"
]);

export const ESTABLISHED_SOURCE_NAMES = [
  "billboard",
  "variety",
  "rolling stone",
  "hollywood reporter",
  "wwd",
  "deadline",
  "stereogum",
  "the guardian",
  "bbc",
  "bbc news",
  "the new york times",
  "new york times",
  "people",
  "entertainment tonight",
  "et online",
  "vogue",
  "elle",
  "harper's bazaar",
  "the tennessean",
  "kansas city star",
  "pitchfork",
  "forbes",
  "nbc news",
  "cbs news",
  "today",
  "ap",
  "associated press",
  "reuters",
  "usa today",
  "snopes",
  "yahoo entertainment",
  "the sporting news",
  "w magazine",
  "fox 17"
];

export const VAULT_SOURCE_TIER_BY_TYPE = {
  "official": "official",
  "interview": "official",
  "reputable_press": "established",
  "chart_database": "established",
  "awards_database": "established",
  "fashion_database": "established",
  "wiki": "established",
  "fan_forum": "fan",
  "social": "fan",
  "video": "established",
  "image_source": "established"
};

export const RUMOR_SOURCE_TIERS = ["official","established","tabloid","social"];

export const OUTLET_TIER_MAP = {
  "billboard.com": {
    "name": "Billboard",
    "tier": "established"
  },
  "variety.com": {
    "name": "Variety",
    "tier": "established"
  },
  "rollingstone.com": {
    "name": "Rolling Stone",
    "tier": "established"
  },
  "hollywoodreporter.com": {
    "name": "The Hollywood Reporter",
    "tier": "established"
  },
  "wwd.com": {
    "name": "WWD",
    "tier": "established"
  },
  "deadline.com": {
    "name": "Deadline",
    "tier": "established"
  },
  "stereogum.com": {
    "name": "Stereogum",
    "tier": "established"
  },
  "theguardian.com": {
    "name": "The Guardian",
    "tier": "established"
  },
  "bbc.co.uk": {
    "name": "BBC News",
    "tier": "established"
  },
  "bbc.com": {
    "name": "BBC News",
    "tier": "established"
  },
  "nytimes.com": {
    "name": "The New York Times",
    "tier": "established"
  },
  "people.com": {
    "name": "People",
    "tier": "established"
  },
  "etonline.com": {
    "name": "Entertainment Tonight",
    "tier": "established"
  },
  "vogue.com": {
    "name": "Vogue",
    "tier": "established"
  },
  "elle.com": {
    "name": "Elle",
    "tier": "established"
  },
  "harpersbazaar.com": {
    "name": "Harper's Bazaar",
    "tier": "established"
  },
  "tennessean.com": {
    "name": "The Tennessean",
    "tier": "established"
  },
  "kansascity.com": {
    "name": "The Kansas City Star",
    "tier": "established"
  },
  "pitchfork.com": {
    "name": "Pitchfork",
    "tier": "established"
  }
};
