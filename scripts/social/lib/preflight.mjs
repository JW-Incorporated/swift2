// Deploy-lag preflight — HEAD-checks that queued media is actually reachable
// at its live URL before post-queue.mjs spends a real IG/X publish attempt
// (and, for IG, a real Graph API container) on it. Added 2026-08-11: an item
// scheduled right at/after its PR's merge can beat Vercel's deploy to the
// live site by a few minutes, and without this check that burned a full
// `attempts` retry (die in 1.5h at 3 attempts x 30 min) for what was really
// just "not deployed yet" — nothing wrong with the item itself. Kept in its
// own tiny module (network, no filesystem) so it's unit-testable by
// injecting a fake `fetchImpl` — no real HTTP in tests.

/**
 * Checks every URL in order and stops at the first one that isn't reachable.
 * Returns { ok: true } when all are reachable, or { ok: false, reason } with
 * a human-readable reason for the first failure (network error or non-2xx).
 */
export async function mediaUrlsReachable(urls, fetchImpl = fetch) {
  for (const url of urls) {
    let res;
    try {
      res = await fetchImpl(url, { method: 'HEAD' });
    } catch (err) {
      return { ok: false, reason: `HEAD ${url} threw: ${err.message ?? err}` };
    }
    if (!res.ok) {
      return { ok: false, reason: `HEAD ${url} returned ${res.status}` };
    }
  }
  return { ok: true, reason: null };
}
