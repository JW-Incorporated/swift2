// Every newly published moment needs authored visual media. These are the
// stable keys and exact content hashes of older rows that predate the rule.
// Editing one invalidates its exemption, so fresh prose cannot ship without
// adding media. The migration ledger is docs/content/historical-media-
// migration-2026-09-15.md; content-only changes cannot add an exemption.
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { slugify } from './longlive-sync-shared.mjs';

export const MEDIA_LEGACY = new Map([
]);

// Stable keys of text-only rows that predate P1-23. Edits retain the exemption,
// while a new key must include renderable media. The compact encoding keeps
// this gate reviewable without letting the legacy corpus dominate the module;
// content-only changes cannot add entries here.
const SURFACE_MEDIA_LEGACY_TEXT = `
releases/releases.mjs#taylor-swift;releases/releases.mjs#napster-live;releases/releases.mjs#the-taylor-swift-holiday-collection
releases/releases.mjs#itunes-live-from-soho;releases/releases.mjs#beautiful-eyes;releases/releases.mjs#fearless
releases/releases.mjs#fearless-platinum-edition;releases/releases.mjs#speak-now;releases/releases.mjs#speak-now-world-tour-live
releases/releases.mjs#red;releases/releases.mjs#1989;releases/releases.mjs#reputation
releases/releases.mjs#spotify-singles;releases/releases.mjs#lover;releases/releases.mjs#live-from-clear-channel-stripped-2008
releases/releases.mjs#folklore;releases/releases.mjs#folklore-the-long-pond-studio-sessions;releases/releases.mjs#evermore
releases/releases.mjs#fearless-taylors-version;releases/releases.mjs#red-taylors-version;releases/releases.mjs#midnights
releases/releases.mjs#midnights-3am-edition;releases/releases.mjs#lover-live-from-paris;releases/releases.mjs#midnights-the-til-dawn-edition
releases/releases.mjs#speak-now-taylors-version;releases/releases.mjs#1989-taylors-version;releases/releases.mjs#the-tortured-poets-department
releases/releases.mjs#ttpd-the-anthology;releases/releases.mjs#the-life-of-a-showgirl;tours/tours.mjs#fearless-tour
tours/tours.mjs#speak-now-world-tour;tours/tours.mjs#the-red-tour;tours/tours.mjs#the-1989-world-tour
tours/tours.mjs#reputation-stadium-tour;tours/tours.mjs#the-eras-tour;theories/1989.mjs#no-its-becky
theories/1989.mjs#1989-lowercase-liner-codes;theories/1989.mjs#1989-polaroid-cover;theories/1989.mjs#1989-deluxe-voice-memos
theories/1989.mjs#blank-space-media-caricature;theories/1989.mjs#blank-space-starbucks-lovers;theories/debut.mjs#lucky-number-13
theories/debut.mjs#liner-notes-hidden-messages;theories/debut.mjs#tim-mcgraw-debut-single-nested-clue;theories/debut.mjs#the-outside-first-song-outcast
theories/debut.mjs#a-place-in-this-world-mission-statement;theories/evermore.mjs#thirteen-backwards;theories/evermore.mjs#dorothea-and-the-love-triangle
theories/evermore.mjs#ivy-the-affair-narrative;theories/evermore.mjs#cowboy-like-me-two-con-artists;theories/evermore.mjs#closure-discomfort-by-design
theories/evermore.mjs#evermore-bonus-tracks-true-ending;theories/evermore.mjs#marjorie-grandmothers-vocals;theories/fearless.mjs#the-best-day-liner-note-code
theories/fearless.mjs#vault-track-anagram-reveal;theories/fearless.mjs#the-best-day-surprise-home-video;theories/fearless.mjs#love-story-rewritten-ending
theories/fearless.mjs#change-underdog-anthem;theories/folklore.mjs#woodvale;theories/folklore.mjs#teenage-love-triangle
theories/folklore.mjs#william-bowery;theories/lover.mjs#butterfly-mural;theories/lover.mjs#mastermind-doctrine
theories/lover.mjs#me-video-chicks-painting;theories/lover.mjs#the-man-karma-graffiti;theories/lover.mjs#lover-house-eras-map
theories/midnights.mjs#karma-lost-album;theories/midnights.mjs#bejeweled-speak-now-clues;theories/midnights.mjs#vault-puzzles-1989
theories/midnights.mjs#eight-nine-sofi;theories/midnights.mjs#album-color-canon;theories/midnights.mjs#surprise-song-metagame
theories/midnights.mjs#friendship-bracelets;theories/red.mjs#twenty-two-liner-note-code;theories/red.mjs#vault-track-word-puzzle-reveal
theories/red.mjs#not-a-lot-going-on-shirt;theories/red.mjs#i-bet-you-think-about-me-video-eggs;theories/red.mjs#all-too-well-original-ten-minutes
theories/red.mjs#i-bet-you-think-about-me-rerecord-clues;theories/reputation.mjs#snake-reclamation;theories/reputation.mjs#lwymmd-nils-sjoberg-gravestone
theories/reputation.mjs#lwymmd-dollar-bill;theories/reputation.mjs#old-taylors-ending;theories/reputation.mjs#lwymmd-et-tu-brute
theories/reputation.mjs#reputation-tabloid-cover;theories/speak-now.mjs#never-grow-up-liner-note-code;theories/speak-now.mjs#speak-now-tv-tracklist-reveal
theories/speak-now.mjs#mine-leak-rush-release;theories/speak-now.mjs#speak-now-tour-surprise-covers;theories/speak-now.mjs#speak-now-written-entirely-alone
theories/speak-now.mjs#long-live-band-and-fans-tribute;theories/the-life-of-a-showgirl.mjs#orange-era-clues;theories/the-life-of-a-showgirl.mjs#ophelia-rewrite
theories/the-life-of-a-showgirl.mjs#father-figure-george-michael-interpolation;theories/the-life-of-a-showgirl.mjs#eldest-daughter-track-five;theories/the-life-of-a-showgirl.mjs#ophelia-video-self-references
theories/the-life-of-a-showgirl.mjs#ts12-twelfth-album-twelve-tracks;theories/the-life-of-a-showgirl.mjs#showgirl-spotify-canvas-color-swap;theories/the-life-of-a-showgirl.mjs#gracie-abrams-death-wish-not-about-taylor
theories/the-life-of-a-showgirl.mjs#showgirl-esb-green-ts-debut-era;theories/tortured-poets.mjs#thank-you-aimee-capitals;theories/tortured-poets.mjs#peter-pan-throughline
theories/tortured-poets.mjs#fortnight-dead-poets-casting;theories/tortured-poets.mjs#ttpd-spotify-library-eggs;theories/tortured-poets.mjs#black-dog-real-pub
theories/tortured-poets.mjs#ttpd-grief-playlists;theories/tortured-poets.mjs#clara-bow-it-girl-lineage;theories/tortured-poets.mjs#cassandra-reputation-callback
theories/tortured-poets.mjs#ttpd-quill-fountain-pen-era;videos/1989.mjs#the-1989-world-tour-live-film;videos/fearless.mjs#journey-to-fearless
videos/lover.mjs#miss-americana;videos/lover.mjs#city-of-lover;videos/midnights.mjs#taylor-swift-the-eras-tour-film
videos/reputation.mjs#reputation-stadium-tour-film;videos/speak-now.mjs#speak-now-world-tour-live;videos/the-life-of-a-showgirl.mjs#the-official-release-party-of-a-showgirl
social/inbox/appearance-2026-10-12-FqbcAAKQjes.json;merch/official.mjs#8238952612040;merch/official.mjs#8239061434568
`;

export const SURFACE_MEDIA_LEGACY = new Set(SURFACE_MEDIA_LEGACY_TEXT.trim().split(/[;\s]+/));

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const https = (value) => text(value) && value === value.trim() && /^https:\/\//i.test(value);
const placeholderImage = (value) => {
  if (!text(value)) return false;
  try {
    const pathname = new URL(value).pathname;
    return /^\/eras\//i.test(pathname) || /(?:^|[/_.-])placeholder(?:[/_.-]|$)/i.test(pathname);
  } catch {
    return true;
  }
};

const renderableMediaEntry = (media) => {
  if (!media || typeof media !== 'object') return false;
  if (media.kind === 'oembed') return https(media.post_url);
  if (media.kind === 'owned') return text(media.asset_path) && text(media.license_ref);
  if (media.kind === 'hotlink_legacy') return https(media.url) && !placeholderImage(media.url);
  return false;
};

/** Missing-media predicates for the non-moment surfaces P1-23 can gate
 * without changing their data models. */
export function nonMomentMediaErrors(row) {
  return Array.isArray(row?.media) && row.media.some(renderableMediaEntry)
    ? []
    : ['record needs renderable media (oEmbed, owned asset, or hotlink)'];
}

export function socialInboxMediaErrors(intent) {
  return Array.isArray(intent?.media) && intent.media.some(text)
    ? []
    : ['social inbox intent needs at least one media path'];
}

export function merchMediaErrors(row) {
  return https(row?.imageUrl) && !placeholderImage(row.imageUrl)
    ? []
    : ['merch row needs a non-placeholder https imageUrl'];
}

export function surfaceMediaPublicationVerdict(
  key,
  item,
  itemErrors,
  legacy = SURFACE_MEDIA_LEGACY,
) {
  const grandfathered = legacy.has(key);
  return { errors: grandfathered ? [] : itemErrors, legacyGap: grandfathered };
}

/** Returns errors for authored media that cannot render as a useful visual. */
export function momentMediaErrors(item) {
  const errors = [];
  const thumbnail = item?.thumbnailUrl;
  const photos = item?.moment?.photos;
  const video = item?.video ?? item?.moment?.video;
  const social = item?.socialPost ?? item?.moment?.socialPost;

  const validThumbnail = https(thumbnail) && !placeholderImage(thumbnail);
  const validPhotos = Array.isArray(photos)
    ? photos.filter((photo) => photo && https(photo.url) && !placeholderImage(photo.url))
    : [];
  const validVideo =
    video &&
    text(video.youtubeId) &&
    /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId) &&
    text(video.title);
  const validSocial =
    social &&
    social.platform === 'instagram' &&
    text(social.shortcode) &&
    /^[A-Za-z0-9_-]+$/.test(social.shortcode) &&
    text(social.label);

  if (thumbnail != null && !validThumbnail)
    errors.push('thumbnailUrl must be an authored https image, not blank or era fallback art');
  if (video != null && !validVideo)
    errors.push('video requires an 11-character YouTube id and non-empty title');
  if (social != null && !validSocial)
    errors.push('socialPost requires a valid Instagram shortcode and non-empty label');
  if (!validThumbnail && validPhotos.length === 0 && !validVideo && !validSocial)
    errors.push(
      'published moment needs an authored photo, thumbnail, YouTube video, or Instagram embed; empty arrays/objects and source links do not count',
    );
  return errors;
}

export const momentFingerprint = (item) =>
  createHash('sha256').update(JSON.stringify(item)).digest('hex');

export function mediaPublicationVerdict(key, item, legacy = MEDIA_LEGACY) {
  const errors = momentMediaErrors(item);
  const onlyMissing = errors.length === 1 && errors[0].startsWith('published moment needs');
  const exactLegacy = legacy.get(key) === momentFingerprint(item);
  return {
    errors: onlyMissing && exactLegacy ? [] : errors,
    legacyGap: onlyMissing && exactLegacy,
  };
}

export function mediaCorpusErrors(loaded, legacy = MEDIA_LEGACY) {
  const findings = [];
  const seen = new Set();
  const exactLegacyGaps = new Set();
  for (const { file, data } of loaded) {
    for (const [index, item] of (data?.items ?? []).entries()) {
      const key = `${file}#${item.slug ?? slugify(item.title)}`;
      seen.add(key);
      const verdict = mediaPublicationVerdict(key, item, legacy);
      if (verdict.legacyGap) exactLegacyGaps.add(key);
      for (const message of verdict.errors)
        findings.push({ file, index, title: item.title, message });
    }
  }
  for (const key of legacy.keys()) {
    if (!seen.has(key))
      findings.push({
        message: `MEDIA_LEGACY lists "${key}", which matches no moment — delete the entry`,
      });
    else if (!exactLegacyGaps.has(key))
      findings.push({
        message: `MEDIA_LEGACY lists "${key}", but it no longer matches the exact legacy snapshot — add media and delete the entry`,
      });
  }
  return findings;
}

export async function assertSeedMomentMedia(seedDir) {
  const contentDir = new URL('./content/', pathToFileURL(`${seedDir}/`));
  const loaded = [];
  for (const file of readdirSync(contentDir)
    .filter((name) => name.endsWith('.mjs') && !name.startsWith('_'))
    .sort()) {
    loaded.push({ file, data: (await import(new URL(file, contentDir))).default });
  }
  const findings = mediaCorpusErrors(loaded);
  if (findings.length) {
    const detail = findings
      .map(
        (finding) =>
          `${finding.file ?? 'legacy'}${finding.index == null ? '' : `[${finding.index}]`}: ${finding.message}`,
      )
      .join('\n');
    throw new Error(`content media publication gate failed:\n${detail}`);
  }
}
