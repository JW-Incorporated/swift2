export const ETSY_QUERIES = [
  'Taylor Swift inspired',
  'Swiftie bracelet',
  'Eras Tour inspired',
  'folklore inspired',
  'Midnights inspired',
];

// Static fallback only — the live source of truth is `community_watchlist`
// (platform='reddit', scan=true), loaded via `loadWatchlistSubreddits()` in
// fanmade-discovery.mjs (Community Engine plan P2-7, §3.5: "widen E5 rather
// than build anew ... REDDIT_SUBREDDITS -> add TaylorSwiftMerch-adjacent subs
// from the watchlist"). This list is what's used when Supabase credentials
// are unavailable (local dry runs) or the watchlist query comes back empty.
export const REDDIT_SUBREDDITS = ['TaylorSwiftMerch'];

export const SHOP_DOMAIN_ALLOWLIST = ['etsy.com', 'www.etsy.com', 'shop.app'];
export const SHOP_DOMAIN_SUFFIX_ALLOWLIST = ['.myshopify.com'];

export const SUBMISSION_LABEL = 'link-submission';
export const FANMADE_CANDIDATE_LABEL = 'fanmade-candidate';
export const FANMADE_ISSUE_PREFIX = 'fanmade-candidate:';

export const ETSY_FAILURE_LABEL = 'fanmade-etsy-outage';
export const ETSY_FAILURE_ISSUE_PREFIX = 'fanmade-etsy-outage:';
