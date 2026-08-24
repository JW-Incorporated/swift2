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
  'cdn01.justjared.com',
  'cloudfront-us-east-1.images.arcpublishing.com',
  'consequence.net',
  'd3i6fh83elv35t.cloudfront.net',
  'deadline.com',
  'entertainmentnow.com',
  'fashiongonerogue.com',
  'fashionsizzle.com',
  'format.creatorcdn.com',
  'fortune.com',
  'graziamagazine.com',
  'headlineplanet.com',
  'hollywoodlife.com',
  'i.abcnewsfe.com',
  'i.cbc.ca',
  'i.guim.co.uk',
  'i.iheart.com',
  'i0.wp.com',
  'image.cnbcfm.com',
  'images.complex.com',
  'images.foxtv.com',
  'images.hellomagazine.com',
  'images.prismic.io',
  'images.squarespace-cdn.com',
  'images.wral.com',
  'images2.minutemediacdn.com',
  'imagez.tmz.com',
  'img.mlbstatic.com',
  'imgix.bustle.com',
  'jj-justjared-media.s3.amazonaws.com',
  'jj-justjared-media.s3.us-east-1.amazonaws.com',
  'jj-justjaredjr-media.s3.amazonaws.com',
  'jj-justjaredjr-media.s3.us-east-1.amazonaws.com',
  'lede-admin.stereogum.com',
  'media.cnn.com',
  'media.glamour.com',
  'media.nbcbayarea.com',
  'media.nbcphiladelphia.com',
  'media.npr.org',
  'media.vanityfair.com',
  'media.zenfs.com',
  'medias.spotern.com',
  'neon.reviewjournal.com',
  'news.wwu.edu',
  'npr.brightspotcdn.com',
  'petapixel.com',
  'ra-grammy-media.ncp.consulting',
  's.abcnews.com',
  's.yimg.com',
  's2.r29static.com',
  'skift.com',
  'specials-images.forbesimg.com',
  'sportshub.cbsistatic.com',
  'static.gofugyourself.com',
  'static.time.com',
  'static3.refinery29.com',
  'stealherstyle.net',
  'storage.googleapis.com',
  'styledarlingdaily.com',
  'taylorpictures.net',
  'tayswiftstyle.wordpress.com',
  'thefader-res.cloudinary.com',
  'thewaltdisneycompany.com',
  'wish-media.s3.us-east-2.amazonaws.com',
  'wsjshop.com',
  'wwd.com',
  'www.deseret.com',
  'www.etonline.com',
  'www.femestella.com',
  'www.guinnessworldrecords.com',
  'www.inquirer.com',
  'www.nickiswift.com',
  'www.redcarpet-fashionawards.com',
  'www.rte.ie',
  'www.shefinds.com',
  'www.thelist.com',
  'www.wideopencountry.com',
]);

/** Same host-extraction rule everywhere: lowercase hostname, or null. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}
