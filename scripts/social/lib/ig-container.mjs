// Instagram Content Publishing: the container-readiness poll that
// postToInstagram was missing (issue #1897).
//
// Meta's Content Publishing flow is two calls — POST /media creates a
// *container* (Meta then goes and fetches the image from the public URL you
// gave it), and POST /media_publish publishes that container. The container
// is NOT ready the instant /media returns an id: Meta is still downloading
// and transcoding the media. Meta's own documentation says to poll the
// container's `status_code` until it reads `FINISHED` before publishing.
// post-queue.mjs called /media_publish immediately, milliseconds later.
//
// It cost a real post: 2026-07-27-all-too-well-scarf-metaphor-ig.json died
// with `{"code":9007,"error_subcode":2207027,"error_user_msg":"The media is
// not ready for publishing, please wait for a moment"}`.
//
// ⚠️ WHY RETRIES DID NOT SAVE IT, AND WHY A "SKIP RETRIES WHEN
// is_transient IS FALSE" RULE MUST EXCLUDE THIS ERROR.
//
// 1. Retries can't fix it. Each poster attempt builds a *brand new*
//    container and publishes it milliseconds later, so the race is entirely
//    intra-attempt. The 30 minutes between runs buy nothing at all — the
//    next attempt reproduces the identical millisecond-scale race. That is
//    why this has to be fixed inside a single attempt, here.
//
// 2. That error arrives with `"is_transient": false` while its own
//    `error_user_msg` literally says "please wait for a moment". Meta's
//    is_transient flag is wrong for 9007/2207027. If anyone ever adds a
//    "don't waste retries on non-transient errors" fast-fail rule to the
//    poster, it MUST exclude code 9007 / subcode 2207027 (see
//    IG_MEDIA_NOT_READY below) or it will hard-fail exactly the case that
//    just needed another second.
//
// Facebook's /photos endpoint is synchronous — it does the fetch inline and
// returns the finished post id — so postToFacebookPage needs none of this.

/** The Meta error that lies about being non-transient. See the header. */
export const IG_MEDIA_NOT_READY = { code: 9007, subcode: 2207027 };

/** True for the 9007/2207027 "media is not ready" error, regardless of the
 * `is_transient: false` Meta stamps on it. Any future retry-suppression rule
 * keyed on `is_transient` must special-case this. */
export function isMediaNotReadyError(errorBody) {
  const err = errorBody?.error ?? errorBody;
  return err?.code === IG_MEDIA_NOT_READY.code && err?.error_subcode === IG_MEDIA_NOT_READY.subcode;
}

/** Terminal-good container states. PUBLISHED is included so a retry that
 * somehow re-polls an already-published container doesn't stall to timeout. */
const READY = new Set(['FINISHED', 'PUBLISHED']);
/** Terminal-bad container states — no amount of further waiting helps. */
const DEAD = new Set(['ERROR', 'EXPIRED']);

/**
 * Bounded poll defaults. 90s is the ceiling because the poster runs every 30
 * minutes and posts at most MAX_POSTS_PER_RUN (5) items: even the worst case
 * (5 carousels of 3, each child + parent polled) cannot approach the job
 * timeout. 3s between polls keeps a normal single photo — which is typically
 * ready on the first or second poll — fast, without hammering the Graph API.
 */
export const CONTAINER_POLL_DEFAULTS = { timeoutMs: 90_000, intervalMs: 3_000 };

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls `containerId`'s `status_code` until it is FINISHED (ready to
 * publish), and resolves. Throws if the container reaches ERROR/EXPIRED, or
 * if it is still IN_PROGRESS when `timeoutMs` elapses — in both cases the
 * caller treats it as a normal post failure, which is correct: an ERROR
 * container means the media URL genuinely didn't work, and a container still
 * unfinished after 90s is not something publishing would have fixed.
 *
 * `graphRoot` is `https://graph.facebook.com/<version>` — the status read is
 * on the CONTAINER's own node, not under the IG user id that /media and
 * /media_publish hang off.
 *
 * All timing and I/O is injectable so tests never sleep or touch the network.
 */
export async function waitForContainerReady(graphRoot, accessToken, containerId, options = {}) {
  const {
    timeoutMs = CONTAINER_POLL_DEFAULTS.timeoutMs,
    intervalMs = CONTAINER_POLL_DEFAULTS.intervalMs,
    fetchImpl = fetch,
    sleep = defaultSleep,
    now = () => Date.now(),
  } = options;

  const deadline = now() + timeoutMs;
  let polls = 0;

  for (;;) {
    const url = `${graphRoot}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetchImpl(url);
    const body = await res.json().catch(() => ({}));
    polls += 1;

    if (!res.ok) {
      throw new Error(`Instagram container status check failed for ${containerId} (${res.status}): ${JSON.stringify(body)}`);
    }

    const lastStatus = body.status_code ?? 'UNKNOWN';
    if (READY.has(lastStatus)) return { status: lastStatus, polls };
    if (DEAD.has(lastStatus)) {
      throw new Error(
        `Instagram container ${containerId} reached terminal status ${lastStatus} — Meta could not process the media. ` +
          `Detail: ${body.status ?? '(none)'}`,
      );
    }

    // IN_PROGRESS (or an unrecognised status — treat as still working).
    if (now() >= deadline) {
      throw new Error(
        `Instagram container ${containerId} was still "${lastStatus}" after ${Math.round(timeoutMs / 1000)}s ` +
          `(${polls} polls) — giving up rather than publishing a container Meta has not finished. ` +
          `This is the 9007/2207027 "media is not ready" case (issue #1897); publishing anyway is what caused it.`,
      );
    }
    await sleep(intervalMs);
  }
}
