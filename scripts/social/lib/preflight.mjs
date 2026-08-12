// Deploy-lag preflight — HEAD-checks that queued media is actually reachable
// at its live URL before post-queue.mjs spends a real IG/X publish attempt
// (and, for IG, a real Graph API container) on it. Added 2026-08-11: an item
// scheduled right at/after its PR's merge can beat Vercel's deploy to the
// live site by a few minutes, and without this check that burned a full
// `attempts` retry (die in 1.5h at 3 attempts x 30 min) for what was really
// just "not deployed yet" — nothing wrong with the item itself. Kept in its
// own tiny module (network, no filesystem) so it's unit-testable by
// injecting a fake `fetchImpl` — no real HTTP in tests.

const DEFAULT_TIMEOUT_MS = 10_000;

/** Rejects if `promise` doesn't settle within `ms`. Wraps every network call
 * below — a hung connection must not hang the whole poster run. */
function withTimeout(promise, ms, url) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms fetching ${url}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Checks one URL: HEAD first; some hosts/CDNs reply 405 (Method Not Allowed)
 * or 501 (Not Implemented) to HEAD specifically, so those two statuses fall
 * back to a ranged GET (first byte only, via `Range: bytes=0-0`) rather than
 * downloading the whole image just to prove liveness. Also requires the
 * content-type to look like an image WHEN the server sends one at all — a
 * live-but-wrong response (a redirected-to-login-page 200, a misconfigured
 * default page) shouldn't read as "deployed and fine." A response with no
 * content-type header at all is not penalized (some hosts omit it on HEAD),
 * only one that explicitly disagrees.
 */
async function checkOne(url, fetchImpl, timeoutMs) {
  let res;
  try {
    res = await withTimeout(fetchImpl(url, { method: 'HEAD' }), timeoutMs, url);
  } catch (err) {
    return { ok: false, reason: `HEAD ${url} threw: ${err.message ?? err}` };
  }

  if (res.status === 405 || res.status === 501) {
    try {
      res = await withTimeout(fetchImpl(url, { method: 'GET', headers: { Range: 'bytes=0-0' } }), timeoutMs, url);
    } catch (err) {
      return { ok: false, reason: `ranged GET ${url} threw (after HEAD returned ${res.status}): ${err.message ?? err}` };
    }
  }

  if (!res.ok) {
    return { ok: false, reason: `${url} returned ${res.status}` };
  }

  const contentType = typeof res.headers?.get === 'function' ? res.headers.get('content-type') : undefined;
  if (contentType && !contentType.startsWith('image/')) {
    return { ok: false, reason: `${url} responded ${res.status} but content-type was "${contentType}", not an image` };
  }

  return { ok: true, reason: null };
}

/**
 * Checks every URL in order and stops at the first one that isn't reachable.
 * Returns { ok: true } when all are reachable, or { ok: false, reason } with
 * a human-readable reason for the first failure (network error, non-2xx,
 * timeout, or a wrong content-type).
 */
export async function mediaUrlsReachable(urls, fetchImpl = fetch, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  for (const url of urls) {
    const result = await checkOne(url, fetchImpl, timeoutMs);
    if (!result.ok) return result;
  }
  return { ok: true, reason: null };
}
