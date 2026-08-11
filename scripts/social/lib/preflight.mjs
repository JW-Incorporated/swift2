// Media-reachability preflight: is this item's media actually live on the
// site yet?
//
// ⚠️ MERGE NOTE: PR #1900 (feature/social-media-engine, Joey) adds this same
// module at this same path with this same export name and return shape. That
// is deliberate on this side — keep ONE copy when the branches integrate;
// either implementation satisfies both callers. Do not end up with two.
//
// WHY THE GATE HAS TO BE HERE AND NOT ONLY AT DRAFT TIME (2026-08-11).
// Instagram does not receive an upload — Meta FETCHES the image from the
// public URL we hand it, so a queued image must be merged AND deployed to
// the live site before `scheduledAt`, or the fetch 404s and the post dies.
// Image PRs deliberately require a human merge (apps/web/public/** sits
// outside the content auto-merge allowlist; 2026-08-06 decision — a
// bot-selected image landing on the public profile with nobody looking is a
// bigger risk than a bot-written caption).
//
// The failure this fixes is the COUPLING, not the gate: the gate covers the
// asset while the clock runs on the schedule. An item whose photo is waiting
// on a human was still "due" the moment its timestamp passed, so it burned
// real publish attempts against a 404 and died in social/failed/ — with the
// entirely predictable result that the drafting agent stopped queueing real
// photos at all and reused already-deployed era art instead (21 of 22
// Instagram posts, and 4 of 4 queued IG items, five days after the decision
// that was meant to end exactly that). Routing around the gate was the only
// way to get a post out on time.
//
// With this check, an item whose media is not yet live is not published, not
// failed, and not charged an attempt — it WAITS, visibly, and ships itself
// on the first run after the human merges the image. Queueing a real photo
// stops being the risky choice.
//
// Network only, no filesystem, so `fetchImpl` injection keeps tests offline.

/**
 * HEAD-checks every URL in order, stopping at the first unreachable one.
 * Returns `{ ok: true, reason: null }` when all are reachable, otherwise
 * `{ ok: false, reason }` describing the first failure (network error or
 * non-2xx). HEAD rather than GET: we only need existence, and these are
 * multi-hundred-KB images fetched every 30 minutes while an item waits.
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
