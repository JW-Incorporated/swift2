// Pass-based retry for the channel-feed fetch.
//
// YouTube's RSS endpoint sometimes answers 404 for EVERY channel for a few
// minutes when called from datacenter IPs (run 37554874410, 2026-10-07: all
// feeds 404; the dispatch ~9h earlier fetched 14/14). Retrying per channel
// would serialize 14 x backoff; instead the whole first pass runs, then only
// the failed channels are retried as a second/third PASS with ONE backoff sleep
// between passes. Failures that are not transient (a feed that parses to zero
// entries, a non-Atom body) are final immediately.

export const PASS_DELAYS_MS = [10_000, 30_000];
// Do not START a retry pass later than this after the run began, so slow
// timeouts can't push the job past the workflow's timeout-minutes.
export const RETRY_DEADLINE_MS = 10 * 60_000;

/**
 * @param {object} o
 * @param {Array} o.channels
 * @param {(channel) => Promise<any>} o.fetchOne  single attempt; throws with
 *   `.transient = true` on 404/429/5xx/network errors.
 * @param {(ms:number) => Promise<void>} o.sleep
 * @param {number[]} [o.delaysMs]  backoff before pass 2, pass 3, ...
 * @param {() => number} [o.jitter]  extra ms added to each backoff
 * @param {() => number} [o.now]
 * @param {(line:string) => void} [o.log]
 * @returns {Promise<{results: Map<any, any>, failures: Array<{channel:any, error:Error}>}>}
 */
export async function fetchAllFeeds({
  channels,
  fetchOne,
  sleep,
  delaysMs = PASS_DELAYS_MS,
  jitter = () => Math.floor(Math.random() * 2_000),
  now = Date.now,
  log = () => {},
}) {
  const started = now();
  const results = new Map();
  const final = new Map();
  let pending = channels;

  for (let pass = 1; pending.length; pass++) {
    const retry = [];
    for (const channel of pending) {
      try {
        results.set(channel, await fetchOne(channel));
        final.delete(channel);
      } catch (error) {
        final.set(channel, error);
        if (error.transient) retry.push(channel);
      }
    }
    const delay = delaysMs[pass - 1];
    if (!retry.length || delay === undefined) break;
    if (now() - started > RETRY_DEADLINE_MS) {
      log(`  … retry deadline reached, not retrying ${retry.length} channel(s)`);
      break;
    }
    const wait = delay + jitter();
    for (const channel of retry) {
      log(`  … ${final.get(channel).message} — retry pass ${pass + 1} in ${wait}ms`);
    }
    await sleep(wait);
    pending = retry;
  }

  return {
    results,
    failures: [...final].map(([channel, error]) => ({ channel, error })),
  };
}
