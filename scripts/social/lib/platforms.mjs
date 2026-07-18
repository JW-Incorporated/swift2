// One function per platform: takes a queue item + credentials, returns
// { id, url }. Each throws on any non-2xx response with the response body
// included, so failures are legible in the Action log and in the item's
// lastError field.

import { oauth1Header } from './oauth1.mjs';

export const GRAPH_VERSION = 'v25.0';

/**
 * Posts a text tweet via X's v2 API (OAuth1 user context). Image/video
 * tweets are not implemented yet — a queue item with `media` targeting
 * platform "x" is rejected with a clear error rather than silently posting
 * text-only, so a media-bearing X draft fails loudly instead of shipping
 * wrong. See docs/agents/growth.md's automation section for the follow-up.
 */
export async function postToX(item, creds) {
  if (item.media?.length) {
    throw new Error('X image/video posting is not implemented yet — remove media or post this one manually.');
  }
  const url = 'https://api.twitter.com/2/tweets';
  const header = oauth1Header({
    method: 'POST',
    url,
    consumerKey: creds.apiKey,
    consumerSecret: creds.apiKeySecret,
    token: creds.accessToken,
    tokenSecret: creds.accessTokenSecret,
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: header, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: item.body }),
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
