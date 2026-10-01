// Draft-time checks that exist because Tree, not the owner, now decides what to
// post (S2, docs/decisions.md 2026-10-01): the `card` media kind, the optional
// `experiment` object, and the advisory photo-mix. Kept out of check-drafts.mjs
// (already past the file-size line); check-drafts.mjs wires them in.
//
// DEPENDENCY: scripts/social/lib/queue-schema.mjs (a frozen posting-path file)
// does not list `card` in MEDIA_KINDS yet — another PR adds it. This module only
// teaches the PR-time gate to accept a well-formed card; validate-queue.mjs (the
// CI backstop, which imports queue-schema) keeps rejecting `mediaKind: "card"`
// until that PR lands. `experiment` needs nothing there: queue-schema ignores
// unknown keys.

export const CARD_PREFIX = '/social/library/cards/';
export const CARD_SOURCE_ORIGIN = 'https://www.longlivets.com';
export const CARD_SOURCE_PATH = '/api/share-card';
export const CARD_CREDIT = 'Long Live';

/**
 * A designed card is a committed PNG rendered from the site's own
 * /api/share-card route (scripts/social/fetch-share-card.mjs saves it under
 * CARD_PREFIX). It records the exact render URL as `cardUrl` and is credited
 * "Long Live" — it is our own artwork, not a photograph, so it never carries
 * photo credit/source. "Cards never reproduce lyrics" (docs/social/guardrails.md)
 * cannot be checked by a machine; the owner's approval stamp is the backstop.
 */
export function checkCardMedia(item, tile) {
  const findings = [];
  if (!tile.startsWith(CARD_PREFIX) || !tile.toLowerCase().endsWith('.png')) {
    findings.push(`media: mediaKind "card" tile "${tile}" must be a committed PNG under ${CARD_PREFIX} (save it with scripts/social/fetch-share-card.mjs).`);
  }
  let url;
  try {
    url = typeof item.cardUrl === 'string' ? new URL(item.cardUrl) : null;
  } catch {
    url = null;
  }
  if (!url || url.origin !== CARD_SOURCE_ORIGIN || url.pathname !== CARD_SOURCE_PATH) {
    findings.push(`media: mediaKind "card" requires \`cardUrl\` — the ${CARD_SOURCE_ORIGIN}${CARD_SOURCE_PATH}?… URL the PNG was rendered from, so the card is reproducible and auditable (got ${JSON.stringify(item.cardUrl ?? null)}).`);
  }
  if (typeof item.mediaCredit !== 'string' || item.mediaCredit.trim() !== CARD_CREDIT) {
    findings.push(`media: mediaKind "card" must carry \`mediaCredit: ${JSON.stringify(CARD_CREDIT)}\` (got ${JSON.stringify(item.mediaCredit ?? null)}) — it is our own artwork.`);
  }
  return findings;
}

/** `experiment` is optional; when present it must name what is being tried and how it will be judged. */
export function checkExperiment(item) {
  if (item.experiment === undefined) return [];
  const e = item.experiment;
  if (e === null || typeof e !== 'object' || Array.isArray(e)) {
    return ['experiment: must be an object { hypothesis, variant, metric }.'];
  }
  return ['hypothesis', 'variant', 'metric']
    .filter((k) => typeof e[k] !== 'string' || e[k].trim() === '')
    .map((k) => `experiment: \`${k}\` must be a non-empty string — a labelled experiment says what it expects, what is different, and which number will judge it.`);
}

/**
 * Advisory photo-mix (strategy-params.json photoMix): warns when this
 * Instagram draft is not a photo and fewer than `minPhotoShare` of the last
 * `window` posted IG items were. Bare string, or null — the caller prefixes it
 * as a non-fatal warning.
 */
export function photoMixWarning(item, recentIgPosted, params) {
  if (item.platform !== 'instagram' || item.mediaKind === 'photo') return null;
  const { window, minPhotoShare } = params.photoMix;
  const recent = (recentIgPosted ?? []).slice(-window);
  if (recent.length < window) return null;
  const share = recent.filter((p) => p.mediaKind === 'photo').length / recent.length;
  if (share >= minPhotoShare) return null;
  return `media: only ${Math.round(share * 100)}% of the last ${window} posted Instagram items were photos (target ${Math.round(minPhotoShare * 100)}%, strategy-params.json photoMix) and this draft is mediaKind ${JSON.stringify(item.mediaKind ?? null)} — consider a photo.`;
}
