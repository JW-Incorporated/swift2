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
