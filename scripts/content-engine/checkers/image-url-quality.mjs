// Image URL-quality checker (deterministic, NO NETWORK).
//
// Why this exists — a structural gap found 2026-07-17: the only image-quality
// signal we had (image-liveness.mjs' resolution check) reads dimensions from
// the *fetched bytes*, so it goes completely dark whenever the runner can't
// reach image hosts. For a long stretch the cloud runner's egress policy
// blocked those fetches, so every probe came back "unverified" and NO
// low-resolution finding could ever fire — junk thumbnails shipped unflagged
// (e.g. the Fearless era's 250px Wikimedia thumbnails).
//
// This checker needs no network at all: many junk-image URLs *declare* their
// defect in the URL itself. A Wikimedia thumbnail path literally encodes its
// render width ("/250px-Foo.png"); a Getty comp URL is a watermarked preview by
// host. We flag those from the string alone, so the quality gate keeps working
// even with egress down — and it complements (does not replace) the byte-level
// resolution check, which stays the source of truth when the network is up.
import { makeFinding } from '../lib/finding.mjs';
import { imageIndex } from '../lib/corpus.mjs';
import { CONFIG } from '../config.mjs';

export const id = 'image.url-quality';

const usedNote = (im) =>
  `Used by ${im.usedBy.length} item(s): ${im.usedBy.slice(0, 4).map((u) => u.key).join('; ')}${im.usedBy.length > 4 ? '…' : ''}`;

const refOf = (im) => {
  const first = im.usedBy[0] ?? {};
  return { type: 'image', file: first.file ?? null, era: null, key: im.url, field: null };
};

// A Wikimedia/MediaWiki thumbnail path ends in "/<N>px-<filename>", where N is
// the rendered width in pixels. Catches upload.wikimedia.org and any MediaWiki
// "/thumb/" CDN. Returns the declared width, or null if the URL isn't one.
export function declaredThumbWidth(url) {
  const m = /\/(\d{1,5})px-[^/?#]+(?:[?#]|$)/.exec(url);
  if (!m) return null;
  // Only trust it as a downscaled-thumbnail signal on known thumbnail paths,
  // so an unrelated "...200px-wide-banner.jpg" filename doesn't false-positive.
  if (!/\/thumb\//.test(url) && !/wikimedia\.org/.test(url)) return null;
  return Number(m[1]);
}

// Getty's public preview CDN (media.gettyimages.com) only ever serves
// watermarked comp images — never a clean licensed asset. Hotlinking one puts a
// watermark on the page, which always "looks bad".
export function isGettyComp(url) {
  return /(^|\.)gettyimages\.com\//.test(url) && /\/(id|photos?)\//.test(url) &&
    /media\.gettyimages\.com/.test(url);
}

export async function check(items) {
  const imgs = imageIndex(items).filter((im) => /^https?:\/\//.test(im.url));
  const floor = CONFIG.image.minWidth;
  const findings = [];
  for (const im of imgs) {
    const w = declaredThumbWidth(im.url);
    if (w != null && w < floor) {
      findings.push(makeFinding({
        checker: 'image.quality', severity: 'P2',
        title: `Downscaled thumbnail in URL (${w}px wide)`,
        itemRef: refOf(im), excerpt: im.url,
        evidence: `The URL requests a ${w}px-wide render, below the ${floor}px quality floor — it renders blurry on a full-bleed card. Wikimedia serves any size: drop the "/${w}px-" segment (or raise it) to get the full-resolution original. ${usedNote(im)}`,
        suggestedFix: `Use a ≥${floor}px-wide render (edit the /NNNpx- segment) or the original file.`,
        confidence: 0.9,
      }));
    }
    if (isGettyComp(im.url)) {
      findings.push(makeFinding({
        checker: 'image.quality', severity: 'P2',
        title: 'Watermarked Getty comp image',
        itemRef: refOf(im), excerpt: im.url,
        evidence: `media.gettyimages.com serves only watermarked preview ("comp") images, never a clean licensed asset — it displays with a Getty watermark across it. ${usedNote(im)}`,
        suggestedFix: 'Replace with an unwatermarked image from a reputable/official source.',
        confidence: 0.85,
      }));
    }
  }
  return findings;
}
