// Every newly published moment needs authored visual media. These are the
// stable keys and exact content hashes of older rows that predate the rule.
// Editing one invalidates its exemption, so fresh prose cannot ship without
// adding media. The migration ledger is docs/content/historical-media-
// migration-2026-09-15.md; content-only changes cannot add an exemption.
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { slugify } from './longlive-sync-shared.mjs';
import { CONFIG } from '../content-engine/config.mjs';
import { SURFACE_MEDIA_LEGACY } from './surface-media-legacy.mjs';

export { SURFACE_MEDIA_LEGACY };

export const MEDIA_LEGACY = new Map([
]);

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

const IMAGE_EXT = /\.(?:jpe?g|png|webp|gif|avif|svg)$/i;

// Hosts whose every URL is an image, so an extensionless path is still a
// photo. Every other trusted host (publishers, buckets) hosts article pages
// too, and an extensionless URL there is not evidence of an image.
const IMAGE_ONLY_HOSTS = new Set([
  'upload.wikimedia.org',
  'i.ytimg.com',
  'img.youtube.com',
  'media.gettyimages.com',
  'dims.apnews.com',
  'imageio.forbes.com',
  'media-cldnry.s-nbcnews.com',
  's.yimg.com',
  'media.zenfs.com',
  'cdn.hercampus.com',
  'images.complex.com',
  'i.iheart.com',
]);

// Image-only path prefixes on hosts that are not image-only as a whole.
const IMAGE_PATH_PREFIXES = [{ host: 'media.vanityfair.com', pathPrefix: '/photos/' }];

/** An https URL that points at an image: a known image file extension, or an
 * extensionless path on an image-only host / a scoped image-bucket path
 * (CONFIG.scopedHostAllowlist). A random https page on a trusted publisher or
 * bucket host is not an image. */
const imageLikeUrl = (value) => {
  if (!https(value) || placeholderImage(value)) return false;
  try {
    const { hostname, pathname } = new URL(value);
    if (IMAGE_EXT.test(pathname)) return true;
    const host = hostname.toLowerCase();
    return (
      IMAGE_ONLY_HOSTS.has(host) ||
      [...CONFIG.scopedHostAllowlist, ...IMAGE_PATH_PREFIXES].some(
        (s) => s.host === host && pathname.startsWith(s.pathPrefix),
      )
    );
  } catch {
    return false;
  }
};

const OEMBED_HOSTS = new Set(['youtube.com', 'youtu.be', 'instagram.com']);
const oembedPostUrl = (value) => {
  if (!https(value)) return false;
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^(?:www|m)\./, '');
    return OEMBED_HOSTS.has(host);
  } catch {
    return false;
  }
};

const renderableMediaEntry = (media) => {
  if (!media || typeof media !== 'object') return false;
  if (media.kind === 'oembed') return oembedPostUrl(media.post_url);
  if (media.kind === 'owned') return text(media.asset_path) && text(media.license_ref);
  if (media.kind === 'hotlink_legacy') return imageLikeUrl(media.url);
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
  return imageLikeUrl(row?.imageUrl)
    ? []
    : ['merch row needs a non-placeholder https image imageUrl'];
}

const SURFACE_HASH_LENGTH = 16;

/** A legacy exemption is exact: the key AND the row's content hash must both
 * match, so an edited text-only row must gain media. */
export function surfaceMediaPublicationVerdict(
  key,
  item,
  itemErrors,
  legacy = SURFACE_MEDIA_LEGACY,
) {
  const grandfathered =
    legacy.get(key) === momentFingerprint(item).slice(0, SURFACE_HASH_LENGTH);
  return { errors: grandfathered ? [] : itemErrors, legacyGap: grandfathered };
}

/** Audits the exemption list itself: an entry that gates nothing is dead
 * weight and an entry whose row gained media is a stale exemption. A social
 * inbox entry is keyed to the intent's live `social/inbox/<file>.json` path,
 * but closing one moves the file to `social/inbox/closed/` — a retired intent
 * is no longer a publication candidate, so its entry warns for cleanup rather
 * than failing the build on every PR that performs the normal lifecycle move
 * (issue #6109). */
export function surfaceMediaLegacyFindings(
  legacy,
  { seen, exactGaps, retired = new Set() },
) {
  const findings = [];
  for (const key of legacy.keys()) {
    if (!seen.has(key)) {
      findings.push(
        retired.has(key)
          ? { key, level: 'warn', message: `SURFACE_MEDIA_LEGACY lists "${key}", whose intent is now closed — delete the entry` }
          : { key, level: 'error', message: `SURFACE_MEDIA_LEGACY lists "${key}", which matches no gated row — delete the entry` },
      );
    } else if (!exactGaps.has(key)) {
      findings.push({
        key,
        level: 'error',
        message: `SURFACE_MEDIA_LEGACY lists "${key}", but it no longer matches the exact text-only snapshot — add media and delete the entry`,
      });
    }
  }
  return findings;
}

/** The live-inbox keys that a closed intent under `social/inbox/closed/`
 * used to occupy. */
export const retiredSurfaceMediaKeys = (closedFiles) =>
  new Set(closedFiles.map((file) => `social/inbox/${file}`));

/** Returns errors for authored media that cannot render as a useful visual. */
export function momentMediaErrors(item) {
  const errors = [];
  const thumbnail = item?.thumbnailUrl;
  const photos = item?.moment?.photos;
  const video = item?.video ?? item?.moment?.video;
  const social = item?.socialPost ?? item?.moment?.socialPost;

  const validThumbnail = imageLikeUrl(thumbnail);
  const validPhotos = Array.isArray(photos)
    ? photos.filter((photo) => photo && imageLikeUrl(photo.url))
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
