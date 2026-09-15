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
  [
    'tortured-poets.mjs#a-surprise-afternoon-at-joe-dimaggio-childrens-hospital',
    'eb9c24efbba2a11891a0968ae3fef3470281dc485473e81f4bda91dcd91c96ae',
  ],
  [
    'tortured-poets.mjs#instagram-official-a-backstage-selfie-at-wembley',
    '5b7caa57c6224e7e39fbaa4f5f4f7225b7870d9b49959fe5b8f621b2643dd124',
  ],
  [
    'tortured-poets.mjs#a-surprise-eras-tour-stage-debut-in-a-tuxedo-and-top-hat',
    '960fa771658f1c7ff77252f104ccb91cd3043e3d1071c5e636a8cc477591ab18',
  ],
  [
    'tortured-poets.mjs#a-kiss-goodbye-after-the-final-amsterdam-eras-tour-show',
    '26c4d3fe5df1101aea1024b5cc6b01ea0b39cd8b74a60d424a8e9c0d8fb09fa8',
  ],
  [
    'tortured-poets.mjs#travis-bikes-around-amsterdam-before-the-show',
    '2b9d5d492ddf38b6977d75f21634c47251002964b210ffd7b97a21e5e8757854',
  ],
  [
    'tortured-poets.mjs#rhode-island-reunion-for-blake-livelys-birthday-weekend',
    '0537273ed0db4b886be3a20c9cc0d719df2cdd5d070472de572d525bf3561e02',
  ],
  [
    'tortured-poets.mjs#an-eighth-record-breaking-wembley-show-closes-the-european-l',
    'f2bb4338c6383226b0bfd59f707c6bf43638aafa9d6a339fcba0272a8e3027f0',
  ],
  [
    'tortured-poets.mjs#a-pizza-date-night-in-brooklyn-after-the-chiefs-opener',
    'd1ef4bd3067bb2a112c02e20165ae14a3d5e4985373de181987f674a0c3c4c2f',
  ],
  [
    'tortured-poets.mjs#a-second-straight-nyc-date-night-hand-in-hand',
    '24dcc29a534608f64f9982bce45a4ed5333926e796f5c0912a4e64fbb9b484eb',
  ],
  [
    'tortured-poets.mjs#a-plaid-vivienne-westwood-corset-for-monday-night-football',
    '52cf03798b888ce3e7b85dbd6145ec9cafe1c275fc3da6ea9e4ad4c5e477cff4',
  ],
  [
    'tortured-poets.mjs#a-new-years-eve-kiss-in-kansas-city',
    'dabe04845633bf5c9781bb08c3cc6624ca0bb21e1d231d3113010b09953825f9',
  ],
  [
    'tortured-poets.mjs#a-red-faux-fur-coat-back-at-arrowhead',
    'de8482137ad1801a670b5fbed22180e1e46c73192d92b688426c6dae9e721fd4',
  ],
  [
    'tortured-poets.mjs#a-field-kiss-after-the-afc-championship-win',
    '40336e39bdd503d8ee412cbbf41ae2fe16fc233a438e7f494522147c68ea7387',
  ],
  [
    'tortured-poets.mjs#back-at-arrowhead-for-the-divisional-round-in-a-chanel-tweed',
    '7ebfc7f96ae488494b4f821bad5618e039ba581f6b87d19343893441c87125bd',
  ],
  [
    'tortured-poets.mjs#super-bowl-lix-with-the-haim-sisters-and-ice-spice',
    'de3f4954aec00dcd1047a00edd48fcee9ae0dc61b6c9c71285893d7ff18dd444',
  ],
  [
    'tortured-poets.mjs#a-rare-public-reunion-in-philadelphia',
    'af0b1bb08a93428b341697985908d7b157a1025909a47fd49866b14d31fb4f97',
  ],
  [
    'tortured-poets.mjs#a-sequined-gucci-set-for-a-masters-buyback-dinner-with-selen',
    '38e8f8249d2261da3d709df4dee9b37014f5819081a9dc3f32d7409dfab23815',
  ],
  [
    'tortured-poets.mjs#a-quiet-fourth-of-july-at-montanas-yellowstone-club',
    'b701ff2143f0733cd109c423acabcdeeadda0312a25f4c7250917ee41a457c39',
  ],
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
