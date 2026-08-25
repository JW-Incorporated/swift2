// The image-host allowlist gate for month_item moment photos, and the
// shrinking list of hosts that predate it.
//
// WHY THIS FILE EXISTS
// ---------------------
// scripts/content-engine/config.mjs's CONFIG.hostAllowlist has existed since
// the Karen image-liveness checker (scripts/content-engine/checkers/
// image-liveness.mjs) started flagging off-allowlist photo hosts as a P2
// finding — advisory only, never a merge gate (issue #1968). A photo
// hotlinked from an attacker-controlled host therefore reached
// content-vault.generated.ts and the live page with nothing to stop it; the
// finding just sat in a post-hoc report.
//
// This file makes the allowlist BLOCKING in validate-content.mjs: any
// moment photo (thumbnailUrl or moment.photos[].url) whose host is neither
// on CONFIG.hostAllowlist nor in PHOTO_HOST_LEGACY below is a hard ERROR.
// The hosts below are every off-allowlist host the corpus already used the
// day the gate went up (2026-08-24) — real press/fan-site hosts a human
// authored, not attacker infrastructure. They are grandfathered so flipping
// the gate to blocking doesn't redden the whole corpus; a photo from a
// genuinely NEW host now requires either putting the host on
// CONFIG.hostAllowlist (a reviewed, permanent trust decision) or adding it
// here (a reviewed, reviewable diff to a checked-in file) — never silent.
//
// Same ratchet as UNSOURCED_LEGACY (scripts/lib/sourcing-gate.mjs):
//   * NEVER add a host here to make a build pass — vet it, or don't ship
//     the photo.
//   * A host that stops appearing in the corpus must be REMOVED —
//     validate-content.mjs errors on a stale entry, so the list can only
//     shrink, never rot into a permanent exemption nobody rechecks.
export const PHOTO_HOST_LEGACY = new Set([
  'a1.espncdn.com',
  'a57.foxnews.com',
  'archive.longislandpress.com',
  'assets.newsweek.com',
  'assets.purewow.com',
  'assets.teenvogue.com',
  'assets2.cbsnewsstatic.com',
  'assets3.cbsnewsstatic.com',
  'blogs-images.forbes.com',
  'cdn.abcotvs.com',
  'cdn.hercampus.com',
  'cdn.i-scmp.com',
  'cdn.nba.com',
  'cdn.sanity.io',
  'cdn.shopify.com',
  'entertainmentnow.com',
  'fashionsizzle.com',
  'format.creatorcdn.com',
  'i0.wp.com',
  'images.prismic.io',
  'images.squarespace-cdn.com',
  'medias.spotern.com',
  'ra-grammy-media.ncp.consulting',
  'stealherstyle.net',
  'storage.googleapis.com',
  'taylorpictures.net',
  'tayswiftstyle.wordpress.com',
  'www.femestella.com',
  'www.shefinds.com',
]);

/** Same host-extraction rule everywhere: lowercase hostname, or null. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}
