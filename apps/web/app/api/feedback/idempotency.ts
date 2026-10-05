/**
 * Best-effort, per-instance dedupe of client idempotency ids (an offline
 * outbox may resend a report whose first response was lost). In memory only:
 * a cold start or another instance forgets ids. Durable dedupe is a tracked
 * follow-up, deliberately not built here.
 */
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IDS = 2000;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

const done = new Map<string, number>();
const pending = new Set<string>();

/** A syntactically valid id, else null (an absent/invalid id just skips dedupe). */
export function parseIdempotencyId(value: unknown): string | null {
  return typeof value === 'string' && ID_PATTERN.test(value) ? value : null;
}

function prune(now: number): void {
  for (const [id, at] of done) if (now - at > TTL_MS) done.delete(id);
  while (done.size > MAX_IDS) done.delete(done.keys().next().value as string);
}

/** True when this id was already posted (within 24 h) or is being posted right now. */
export function isDuplicate(id: string, now = Date.now()): boolean {
  prune(now);
  return done.has(id) || pending.has(id);
}

export function markPending(id: string): void {
  pending.add(id);
}

/** Call once the upstream post finished: `ok` records it as done, otherwise it may be retried. */
export function settle(id: string, ok: boolean, now = Date.now()): void {
  pending.delete(id);
  if (ok) done.set(id, now);
}

export function resetIdempotencyForTests(): void {
  done.clear();
  pending.clear();
}
