// Marjorie's Discord delivery module (Marjorie Overhaul C1,
// docs/specs/marjorie-overhaul/c1-delivery.md). A pure transport: text in,
// a delivery result out, nothing persisted. `post-or-mail.mjs` is the only
// caller and decides what to do with a non-ok result (the mail fallback).
//
// Reuse, not reimplementation: chunking and mention-neutralizing are the
// fourth send loop's worth of duplicated logic this repo already has in
// `discord-delivery.mjs`/`weekly-brief.mjs`/`approval-prompt.mjs` — this
// module adds only what was genuinely missing (retry, thread support, the
// fallback-friendly return shape) instead of re-deriving chunking rules.
import { neutralizeMentions, chunkForDiscord } from '../../community/discord-delivery.mjs';

const RETRY_WAIT_MS = 2000;
const MAX_RETRY_WAIT_MS = 120_000;

function defaultWait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cooldownSeconds(value) {
  if (typeof value === 'string') {
    if (!/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
    value = Number(value);
  }
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

// Discord documents both Retry-After and retry_after, in seconds. The
// bucket reset header can be longer; never retry before any valid hint.
async function retryWaitMs(response) {
  if (response && response.status === 429) {
    const cooldowns = [
      response.headers?.get('retry-after'),
      response.headers?.get('x-ratelimit-reset-after'),
    ];
    try {
      const body = await response.json();
      cooldowns.push(body?.retry_after);
    } catch {
      // Header-only rate limits need not carry a JSON body.
    }
    const valid = cooldowns.map(cooldownSeconds).filter((value) => value !== null);
    return valid.length ? Math.ceil(Math.max(...valid) * 1000) : null;
  }
  return RETRY_WAIT_MS;
}

function postUrl(webhook, thread) {
  const url = `${webhook}?wait=true`;
  return thread ? `${url}&thread_id=${thread}` : url;
}

// One attempt at posting a single chunk. A non-2xx HTTP response is a
// normal returned Response, not a throw — only a network-level failure
// (DNS, refused connection, etc.) rejects, which the caller catches.
function postChunk(chunk, { webhook, thread, username, fetchImpl, allowedMentions = { parse: [] } }) {
  return fetchImpl(postUrl(webhook, thread), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: chunk,
      username,
      allowed_mentions: allowedMentions,
    }),
  });
}

// Discord only returns the posted message body (including its `id`) when
// the webhook URL carries `?wait=true` (already always the case in
// `postUrl`) — this reads that id off a successful response without ever
// throwing, so a body that isn't JSON or lacks `id` just yields `null`
// rather than failing the whole post.
async function messageIdOf(response) {
  try {
    const body = await response.json();
    return body && body.id ? body.id : null;
  } catch {
    return null;
  }
}

/**
 * Posts `text` to a Discord webhook, chunked and retried per
 * docs/specs/marjorie-overhaul/c1-delivery.md. Never throws — every
 * failure path (HTTP or network) resolves the `{ ok, chunks, delivered,
 * status, error }` shape below so the caller can decide on a mail fallback.
 * On success, `messageId` carries the FIRST chunk's Discord message id
 * (the id a founder would see/reply to — later chunks are continuation
 * messages, not the thread root), or `null` if the response body didn't
 * carry one. Existing callers that ignore `messageId` are unaffected.
 *
 * `waitImpl` exists only so tests can inject a fake timer instead of
 * actually sleeping through the retry wait, the same way `fetchImpl` lets
 * them inject a fake network — it defaults to a real `setTimeout` wait.
 *
 * `mentionUserIds` (t_85667a3c): opt-in, defaults to `[]` so every existing
 * caller keeps today's behavior of `allowed_mentions: { parse: [] }` (no
 * ping ever fires, even if the text happens to contain `<@id>`-shaped
 * text — the untrusted-content callers like community prompts need that).
 * When a caller passes real Discord user ids here, ONLY those exact ids
 * are allowlisted to ping (`allowed_mentions: { parse: [], users: [...] }`
 * — never the blanket `parse: ['users']`, which would let ANY `<@id>`
 * embedded in `text` ping whoever that id happens to be). This is what
 * makes a real founder @-mention possible at all: `parse: []` alone
 * suppresses the ping notification even when the text is literally
 * `<@338508192755482626>` — Discord still renders the mention link but
 * never notifies.
 */
// `username` defaults to Marjorie; M5's Tree chat replies pass 'Tree'.
export async function post(text, { thread, webhook, username = 'Marjorie', fetchImpl = fetch, waitImpl = defaultWait, mentionUserIds = [] } = {}) {
  const chunks = chunkForDiscord(neutralizeMentions(text));
  const allowedMentions =
    mentionUserIds.length > 0 ? { parse: [], users: mentionUserIds } : { parse: [] };
  let delivered = 0;
  let messageId = null;

  for (const [index, chunk] of chunks.entries()) {
    let response;
    try {
      response = await postChunk(chunk, { webhook, thread, username, fetchImpl, allowedMentions });
    } catch {
      response = undefined;
    }
    if (response?.ok) {
      delivered += 1;
      if (index === 0) messageId = await messageIdOf(response);
      continue;
    }

    const waitMs = await retryWaitMs(response);
    if (waitMs === null || !Number.isFinite(waitMs) || waitMs > MAX_RETRY_WAIT_MS) {
      return {
        ok: false,
        chunks: chunks.length,
        delivered,
        status: response.status,
        retryAfterMs: Number.isFinite(waitMs) ? waitMs : null,
        error: 'Discord rate limit cooldown is unavailable or exceeds the retry wait limit',
      };
    }
    await waitImpl(waitMs);

    let retryResponse;
    let retryError;
    try {
      retryResponse = await postChunk(chunk, { webhook, thread, username, fetchImpl, allowedMentions });
    } catch (err) {
      retryError = err;
    }
    if (retryResponse?.ok) {
      delivered += 1;
      if (index === 0) messageId = await messageIdOf(retryResponse);
      continue;
    }

    // Both attempts on this chunk failed — stop here. `delivered` is
    // already this chunk's 0-based index (every prior chunk incremented it
    // on success), so it doubles as the failing-chunk index the caller's
    // mail fallback needs, to carry the whole message rather than a
    // fragment. Never interpolate `webhook` into `error` — it must never
    // leak the webhook URL into a log line or thrown message.
    return {
      ok: false,
      chunks: chunks.length,
      delivered,
      status: retryResponse ? retryResponse.status : null,
      ...(retryResponse?.status === 429
        ? { retryAfterMs: await retryWaitMs(retryResponse) }
        : {}),
      error: retryError
        ? 'Discord delivery threw a network error'
        : `Discord delivery failed with HTTP ${retryResponse.status}`,
    };
  }

  return { ok: true, chunks: chunks.length, delivered, status: null, error: null, messageId };
}
