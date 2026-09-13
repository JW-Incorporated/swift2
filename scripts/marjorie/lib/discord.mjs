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

function defaultWait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Discord's webhook rate-limit shape is a JSON body field (`retry_after`,
// in seconds) on the 429 response itself, not a `Retry-After` header — this
// is what distinguishes the 429 case from every other non-2xx failure this
// function retries on a fixed wait instead.
async function retryWaitMs(response) {
  if (response && response.status === 429) {
    try {
      const body = await response.json();
      if (body && Number.isFinite(body.retry_after)) return body.retry_after * 1000;
    } catch {
      // Not JSON, or no usable retry_after on it — fall back to the fixed wait.
    }
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
function postChunk(chunk, { webhook, thread, fetchImpl }) {
  return fetchImpl(postUrl(webhook, thread), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: chunk,
      username: 'Marjorie',
      allowed_mentions: { parse: [] },
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
 */
export async function post(text, { thread, webhook, fetchImpl = fetch, waitImpl = defaultWait } = {}) {
  const chunks = chunkForDiscord(neutralizeMentions(text));
  let delivered = 0;
  let messageId = null;

  for (const [index, chunk] of chunks.entries()) {
    let response;
    try {
      response = await postChunk(chunk, { webhook, thread, fetchImpl });
    } catch {
      response = undefined;
    }
    if (response?.ok) {
      delivered += 1;
      if (index === 0) messageId = await messageIdOf(response);
      continue;
    }

    await waitImpl(await retryWaitMs(response));

    let retryResponse;
    let retryError;
    try {
      retryResponse = await postChunk(chunk, { webhook, thread, fetchImpl });
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
      error: retryError
        ? `Discord delivery threw: ${retryError.message || String(retryError)}`
        : `Discord delivery failed with HTTP ${retryResponse.status}`,
    };
  }

  return { ok: true, chunks: chunks.length, delivered, status: null, error: null, messageId };
}
