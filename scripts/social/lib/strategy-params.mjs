// social/strategy-params.json — the TASTE thresholds check-drafts.mjs and
// lib/photo-reuse.mjs used to hard-code (docs/decisions.md 2026-10-01, S2:
// owner instruction "I don't want to be in the rule making business, I want
// to be in the reviewing/approving business"). Tree owns the file and edits it
// by PR with a `why` (and evidence) on every section it changes; it lands
// without a founder merge (.github/content-automerge-allowlist.txt).
//
// WHAT IS DELIBERATELY NOT HERE: the founder-owned GUARDRAILS
// (docs/social/guardrails.md) — credit on every photo, rights, X's 280 weighted
// limit, Instagram's aspect-ratio/image-required rules, story-unique campaign,
// the approval stamp. They stay hard-coded in check-drafts.mjs / queue-schema.mjs
// and no key in this file can switch one off.
//
// A missing, unreadable or malformed file — or one bad field — falls back to
// DEFAULT_PARAMS per field, which equal the behaviour before this file existed.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const KNOWN_MEDIA_KINDS = ['photo', 'site-screen', 'card'];
export const PHOTO_REUSE_SCOPES = ['other-campaigns', 'none'];

export const DEFAULT_PARAMS = Object.freeze({
  media: { allowedKinds: ['photo', 'site-screen', 'card'], requireImageOnX: true },
  siteScreen: { allowedCampaignPrefixes: ['launch:'], requirePhotoGridTile: true },
  photoReuse: { scope: 'other-campaigns', igHistoryWindow: 10, shippedWindowDays: null },
  photoMix: { window: 10, minPhotoShare: 0.7 },
  pairing: { requireBothPlatforms: true, simultaneousWindowMinutes: 5 },
  openers: { wordWindow: 6, postedLookbackDays: 14, bannedOpeners: ['did you know'] },
  crossPost: { similarityThreshold: 0.8, pairedLookingFloor: 0.15 },
  xLength: { warnAt: 270 },
  lessons: { autoCodify: false },
});

const X_HARD_LIMIT = 280;
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const isFraction = (v) => typeof v === 'number' && v >= 0 && v <= 1;
const isStringArray = (v) => Array.isArray(v) && v.every((s) => typeof s === 'string' && s.trim() !== '');

// One validator per field; a value that fails keeps the default.
const FIELD_OK = {
  media: {
    allowedKinds: (v) => isStringArray(v) && v.every((k) => KNOWN_MEDIA_KINDS.includes(k)),
    requireImageOnX: (v) => typeof v === 'boolean',
  },
  siteScreen: {
    allowedCampaignPrefixes: isStringArray,
    requirePhotoGridTile: (v) => typeof v === 'boolean',
  },
  photoReuse: {
    scope: (v) => PHOTO_REUSE_SCOPES.includes(v),
    igHistoryWindow: isPosInt,
    shippedWindowDays: (v) => v === null || isPosInt(v),
  },
  photoMix: { window: isPosInt, minPhotoShare: isFraction },
  pairing: { requireBothPlatforms: (v) => typeof v === 'boolean', simultaneousWindowMinutes: isPosInt },
  openers: { wordWindow: isPosInt, postedLookbackDays: isPosInt, bannedOpeners: isStringArray },
  crossPost: { similarityThreshold: isFraction, pairedLookingFloor: isFraction },
  xLength: { warnAt: (v) => isPosInt(v) && v <= X_HARD_LIMIT },
  lessons: { autoCodify: (v) => typeof v === 'boolean' },
};

/** Per-field merge of `raw` over DEFAULT_PARAMS; invalid fields keep the default. */
export function mergeParams(raw) {
  const out = {};
  for (const [section, defaults] of Object.entries(DEFAULT_PARAMS)) {
    out[section] = { ...defaults };
    const given = raw && typeof raw === 'object' ? raw[section] : null;
    if (!given || typeof given !== 'object') continue;
    for (const key of Object.keys(defaults)) {
      if (key in given && FIELD_OK[section][key](given[key])) out[section][key] = given[key];
    }
  }
  return out;
}

/** Problems with a raw params object (for the committed file's test): unknown/invalid fields, a section with no `why`. */
export function validateStrategyParams(raw) {
  const problems = [];
  if (!raw || typeof raw !== 'object') return ['strategy-params.json must be a JSON object.'];
  for (const [section, defaults] of Object.entries(DEFAULT_PARAMS)) {
    const given = raw[section];
    if (!given || typeof given !== 'object') {
      problems.push(`section "${section}" is missing.`);
      continue;
    }
    if (typeof given.why !== 'string' || given.why.trim() === '') {
      problems.push(`section "${section}" needs a non-empty \`why\` (the evidence for its current values).`);
    }
    for (const key of Object.keys(given)) {
      if (key !== 'why' && !(key in defaults)) problems.push(`section "${section}" has unknown key "${key}".`);
    }
    for (const key of Object.keys(defaults)) {
      if (key in given && !FIELD_OK[section][key](given[key])) problems.push(`${section}.${key} has an invalid value ${JSON.stringify(given[key])}.`);
    }
  }
  return problems;
}

export function loadStrategyParams(root) {
  try {
    return mergeParams(JSON.parse(readFileSync(path.join(root, 'social', 'strategy-params.json'), 'utf8')));
  } catch {
    return mergeParams(null);
  }
}
