// Instagram DM collector for the reply notifier (read-only). Needs the
// `instagram_manage_messages` scope on IG_ACCESS_TOKEN (Meta app "Long Live
// Poster"; granted to the app 2026-10-01, the token must be regenerated to
// carry it). Until it does, the source reports itself disabled — see
// SourceDisabledError — and the notifier keeps running on the other sources.
//
// Endpoint: GET /{ig-business-account-id}/conversations?platform=instagram
// with messages{id,from,message,created_time}. Instagram messaging under the
// Facebook-login flow is normally read with the PAGE access token of the linked
// Page, so the collector first asks `/{page-id}?fields=access_token` for it (shared
// with the FB comments source, one call per run) and
// tries (page token, user token) x (IG account id, Page id) until one answers.
// If every attempt fails and any failure was a permission error, the source is
// disabled for a missing scope; a plain failure is an ordinary source failure.
import { RateLimitError, isPermissionError, makeGraph } from './reply-sources.mjs';

export const IG_INBOX_URL = 'https://www.instagram.com/direct/inbox/';
const MESSAGES_PER_CONVERSATION = 10;

export class SourceDisabledError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'SourceDisabledError';
    this.disabledReason = reason;
  }
}

export async function collectInstagramDms({
  igUserId,
  pageId,
  token,
  fetchImpl = fetch,
  budget,
  graph: userGraph = makeGraph({ token, fetchImpl, budget }),
  onWarn = () => {},
}) {
  const pageToken = await userGraph.pageTokenFor(pageId);
  const tokens = [pageToken, token].filter(Boolean);
  const owners = [igUserId, pageId].filter(Boolean);
  const params = {
    platform: 'instagram',
    fields: `id,updated_time,messages.limit(${MESSAGES_PER_CONVERSATION}){id,from,message,created_time}`,
    limit: '25',
  };
  let conversations = null;
  let permissionDenied = false;
  let lastError = null;
  for (const useToken of tokens) {
    const graph = useToken === token ? userGraph : userGraph.withToken(useToken);
    for (const owner of owners) {
      try {
        conversations = await graph.list(`${owner}/conversations`, params, { maxPages: 1 });
        break;
      } catch (err) {
        if (err instanceof RateLimitError) throw err;
        lastError = err;
        if (isPermissionError(err)) permissionDenied = true;
      }
    }
    if (conversations) break;
  }
  if (!conversations) {
    if (permissionDenied) throw new SourceDisabledError('missing scope (instagram_manage_messages)');
    throw lastError ?? new Error('IG conversations unavailable');
  }

  const ours = new Set([igUserId, pageId].filter(Boolean).map(String));
  const items = [];
  for (const convo of conversations) {
    const messages = convo?.messages?.data;
    if (!Array.isArray(messages)) {
      onWarn(`IG conversation ${convo?.id ?? '?'} returned no messages`);
      continue;
    }
    for (const m of messages) {
      if (!m?.id || (m.from?.id && ours.has(String(m.from.id)))) continue;
      items.push({
        id: `ig-dm:${m.id}`,
        source: 'ig_dms',
        kind: 'ig_dm',
        username: m.from?.username ?? m.from?.name ?? 'someone',
        text: m.message ?? '',
        permalink: IG_INBOX_URL,
        postSnippet: '',
        timestamp: m.created_time ?? null,
      });
    }
  }
  return items;
}
