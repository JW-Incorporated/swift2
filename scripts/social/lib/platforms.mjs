// One function per platform: takes a queue item + credentials, returns
// { id, url }. Each throws on any non-2xx response with the response body
// included, so failures are legible in the Action log and in the item's
// lastError field.

import { oauth1Header } from './oauth1.mjs';

export const GRAPH_VERSION = 'v25.0';

// X (Twitter) caps a single tweet at 4 photos — the v1.1 media/upload
// endpoint itself doesn't enforce this (it'll happily accept a 5th upload),
// the v2 tweet create call rejects it, so we check up front rather than
// burning 4 real uploads before finding out.
export const MAX_X_IMAGES = 4;

const X_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';
const X_TWEET_URL = 'https://api.twitter.com/2/tweets';

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

/** Best-effort content-type from a media path's extension, for the multipart upload. */
export function mimeTypeFor(mediaPath) {
  const ext = String(mediaPath).split('.').pop()?.toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

/**
 * Uploads one image to X's v1.1 media endpoint (simple, non-chunked upload —
 * fine for the still-photo sizes this pipeline ever queues; video/animated
 * GIF would need the chunked INIT/APPEND/FINALIZE flow, not implemented
 * here since nothing in social/queue/ has ever queued one) and returns the
 * resulting media_id_string to attach to the tweet.
 *
 * Deliberately multipart/form-data, not the alternate `media_data` (base64
 * in an x-www-form-urlencoded body) shape: OAuth1 only signs
 * x-www-form-urlencoded bodies, so `media_data` would need the full base64
 * payload folded into the signature base string — correct but needlessly
 * expensive for a multi-hundred-KB image. A multipart body's fields are
 * never part of the OAuth1 signature (per spec), so the Authorization header
 * here signs no body params at all, same as the plain POST /2/tweets below.
 */
async function uploadXMedia(mediaPath, creds, mediaBaseUrl) {
  const imageUrl = `${mediaBaseUrl}${mediaPath}`;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`X media fetch failed for ${imageUrl} (${imgRes.status}) — is it merged AND deployed yet?`);
  const bytes = Buffer.from(await imgRes.arrayBuffer());

  const header = oauth1Header({
    method: 'POST',
    url: X_UPLOAD_URL,
    consumerKey: creds.apiKey,
    consumerSecret: creds.apiKeySecret,
    token: creds.accessToken,
    tokenSecret: creds.accessTokenSecret,
  });
  const form = new FormData();
  form.append('media', new Blob([bytes], { type: mimeTypeFor(mediaPath) }), mediaPath.split('/').pop());
  // No Content-Type header set manually — fetch derives it (with the
  // multipart boundary) from the FormData body itself.
  const res = await fetch(X_UPLOAD_URL, { method: 'POST', headers: { Authorization: header }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X media upload failed for ${mediaPath} (${res.status}): ${JSON.stringify(body)}`);
  return body.media_id_string;
}

/**
 * Posts a tweet via X's v2 API (OAuth1 user context). Text-only when the
 * item has no `media`; otherwise uploads each image (up to MAX_X_IMAGES) via
 * the v1.1 media endpoint first and attaches the resulting media_ids —
 * mirrors postToInstagram's convention of fetching from `mediaBaseUrl` + the
 * item's relative path, so an X image post has the exact same "must be
 * merged AND deployed before scheduledAt" requirement as Instagram.
 */
export async function postToX(item, creds, mediaBaseUrl) {
  if (item.media?.length > MAX_X_IMAGES) {
    throw new Error(`X posts support at most ${MAX_X_IMAGES} images (this draft has ${item.media.length}).`);
  }

  const payload = { text: item.body };
  if (item.media?.length) {
    const mediaIds = [];
    for (const mediaPath of item.media) {
      mediaIds.push(await uploadXMedia(mediaPath, creds, mediaBaseUrl));
    }
    payload.media = { media_ids: mediaIds };
  }

  const header = oauth1Header({
    method: 'POST',
    url: X_TWEET_URL,
    consumerKey: creds.apiKey,
    consumerSecret: creds.apiKeySecret,
    token: creds.accessToken,
    tokenSecret: creds.accessTokenSecret,
  });
  const res = await fetch(X_TWEET_URL, {
    method: 'POST',
    headers: { Authorization: header, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X post failed (${res.status}): ${JSON.stringify(body)}`);
  return { id: body.data.id, url: `https://x.com/longlivetscom/status/${body.data.id}` };
}

/**
 * Posts to Instagram via the Graph API's Content Publishing flow. Requires
 * each media file to already be reachable at a public URL — this repo hosts
 * queued images under apps/web/public/social/**, so `mediaBaseUrl` (the live
 * site origin) + the item's relative path is what Graph API fetches from.
 * That means a queued image needs its PR merged and deployed before its
 * scheduled time — see docs/agents/growth.md.
 */
export async function postToInstagram(item, creds, mediaBaseUrl) {
  if (!item.media?.length) throw new Error('Instagram posts require at least one image in `media`.');

  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${creds.igUserId}`;

  if (item.media.length === 1) {
    const containerId = await createImageContainer(base, creds.accessToken, `${mediaBaseUrl}${item.media[0]}`, item.body);
    return publishContainer(base, creds.accessToken, containerId);
  }

  // Carousel: one child container per image, then a parent carousel container.
  const childIds = [];
  for (const path of item.media) {
    childIds.push(await createImageContainer(base, creds.accessToken, `${mediaBaseUrl}${path}`, null, true));
  }
  const parentRes = await fetch(`${base}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds,
      caption: item.body,
      access_token: creds.accessToken,
    }),
  });
  const parentBody = await parentRes.json();
  if (!parentRes.ok) throw new Error(`Instagram carousel container failed: ${JSON.stringify(parentBody)}`);
  return publishContainer(base, creds.accessToken, parentBody.id);
}

async function createImageContainer(base, accessToken, imageUrl, caption, isCarouselItem = false) {
  const payload = { image_url: imageUrl, access_token: accessToken };
  if (caption) payload.caption = caption;
  if (isCarouselItem) payload.is_carousel_item = true;
  const res = await fetch(`${base}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Instagram media container failed: ${JSON.stringify(body)}`);
  return body.id;
}

async function publishContainer(base, accessToken, creationId) {
  const res = await fetch(`${base}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Instagram publish failed: ${JSON.stringify(body)}`);
  return { id: body.id, url: `https://www.instagram.com/longlivetscom/` };
}

/**
 * Posts to the linked Facebook Page's own feed. This is a genuinely separate
 * post, not a cross-post flag — Instagram's Graph API has no "also share to
 * Facebook" parameter for automated posts (that toggle is native-app-only),
 * so an Instagram publish and a Facebook Page publish are always two
 * independent API calls. Requires the Page token to carry `pages_manage_posts`
 * (the read-only pages_show_list/pages_read_engagement scopes set up for
 * Instagram publishing do not cover writing to the Page's feed).
 */
export async function postToFacebookPage(item, creds, mediaBaseUrl) {
  if (!item.media?.length) throw new Error('Facebook Page posts require at least one image in `media`.');

  const base = `https://graph.facebook.com/${GRAPH_VERSION}/${creds.facebookPageId}`;
  const res = await fetch(`${base}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${mediaBaseUrl}${item.media[0]}`,
      caption: item.body,
      access_token: creds.accessToken,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Facebook Page post failed: ${JSON.stringify(body)}`);
  return { id: body.post_id ?? body.id, url: `https://www.facebook.com/${body.post_id ?? body.id}` };
}
