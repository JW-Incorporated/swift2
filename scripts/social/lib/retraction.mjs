// P2-08 social retraction planning: pure, no I/O, no network, no dispatch.
// Builds the list of delete calls a retraction WOULD make for a campaign's
// posted items. Nothing here executes a call.
export { isSocialFrozen } from './breaking.mjs';

export const GRAPH_VERSION = 'v25.0';

/** Env gate. Anything other than the literal string "true" is off. */
export const isRetractionEnabled = (env) => env?.RETRACTION_SOCIAL_ENABLED === 'true';

/** X API v2 delete-tweet request shape. The tier needed for it is UNVERIFIED. */
export function xDeleteRequest(tweetId) {
  return { method: 'DELETE', url: `https://api.twitter.com/2/tweets/${tweetId}`, auth: 'X OAuth 1.0a user context' };
}

/** Graph API delete for a Facebook Page post. */
export function facebookDeleteRequest(postId) {
  return { method: 'DELETE', url: `https://graph.facebook.com/${GRAPH_VERSION}/${postId}`, auth: 'IG_ACCESS_TOKEN' };
}

/**
 * Plans retraction of every posted record in `campaign`. Instagram has no
 * delete operation in the Content Publishing API (see delete-media.mjs), so
 * its media is reported as a manual removal. A Facebook cross-post is planned
 * from `facebookPostId`. Returns [{ file, platform, action, request?, note? }].
 */
export function planRetraction(records, campaign) {
  const plan = [];
  for (const { file, data } of records) {
    if (!data || data.campaign !== campaign) continue;
    if (data.platform === 'x') {
      plan.push(
        data.platformPostId
          ? { file, platform: 'x', action: 'delete', request: xDeleteRequest(data.platformPostId), note: 'X delete tier UNVERIFIED; fall back to a correction reply' }
          : { file, platform: 'x', action: 'skip', note: 'no platformPostId recorded' },
      );
    } else if (data.platform === 'instagram') {
      plan.push({ file, platform: 'instagram', action: 'manual', note: `Instagram media cannot be deleted via API; remove by hand in the app${data.url ? ` (${data.url})` : ''}` });
      if (data.facebookPostId) plan.push({ file, platform: 'facebook', action: 'delete', request: facebookDeleteRequest(data.facebookPostId) });
    }
  }
  return plan;
}
