// P2-06 breaking social fast path: pure pair shaping. No I/O, no dispatch.
import { PLATFORMS, validateQueueItem } from './queue-schema.mjs';

/** Env gate. Anything other than the literal string "true" is off. */
export const isBreakingEnabled = (env) => env?.BREAKING_SOCIAL_ENABLED === 'true';

/** Mirrors post-queue.mjs's freeze rule: set to anything but "", "false" or "0". */
export const isSocialFrozen = (env) => Boolean(env?.SOCIAL_FREEZE) && env.SOCIAL_FREEZE !== 'false' && env.SOCIAL_FREEZE !== '0';

/**
 * Stamps a drafted pair as breaking and checks it. Pairing is mandatory: one
 * x item and one instagram item sharing a campaign. Never sets `approval`.
 * Returns { items, findings }.
 */
export function shapeBreakingPair(items, { activeLessonIds = [] } = {}) {
  const findings = [];
  if (!Array.isArray(items) || items.length !== 2) return { items: [], findings: ['pair: exactly two items (x + instagram) are required.'] };
  const platforms = items.map((i) => i?.platform).sort();
  if (platforms.join() !== [...PLATFORMS].sort().join()) findings.push('pair: needs one x item and one instagram item.');
  const campaigns = new Set(items.map((i) => (typeof i?.campaign === 'string' ? i.campaign.trim() : '')));
  if (campaigns.size !== 1 || campaigns.has('')) findings.push('pair: both items must share one non-empty campaign.');
  const shaped = items.map((i) => {
    const copy = { ...(i ?? {}), breaking: true };
    delete copy.approval;
    return copy;
  });
  for (const item of shaped) {
    for (const f of validateQueueItem(item, { activeLessonIds })) findings.push(`${item.platform}: ${f}`);
  }
  return { items: shaped, findings };
}
