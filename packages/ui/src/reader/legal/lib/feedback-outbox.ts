import type { useHost } from '../../../host';

type Host = ReturnType<typeof useHost>;

/**
 * Local-only feedback outbox on the host storage abstraction (durable once the
 * persistent reader storage lands, #5059; localStorage on the website). Bounded:
 * one draft + at most MAX_QUEUE queued items, each at most MAX_ITEM_CHARS, so
 * the whole thing stays far below the app storage budget.
 */
export const FEEDBACK_DRAFT_KEY = 'll-feedback-draft-v1';
export const FEEDBACK_QUEUE_KEY = 'll-feedback-outbox-v1';
export const FEEDBACK_LEASE_KEY = 'll-feedback-lease-v1';

export const MAX_QUEUE = 3;
export const MAX_ITEM_CHARS = 8 * 1024;
export const LEASE_MS = 30_000;

export const FEEDBACK_QUEUED_MESSAGE =
  'Couldn’t reach the network — your report is saved and will send when you’re back online.';
export const FEEDBACK_RESTORED_MESSAGE =
  'Your unsent report was restored — press Send to resend it.';
export const FEEDBACK_QUEUE_FULL_MESSAGE =
  'Several reports are still waiting to send — please try again once they go through.';

export type QueuedFeedback = { id: string; message: string };

export function newId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readJson(host: Host, key: string): unknown {
  try {
    const raw = host.storage.local.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(host: Host, key: string, value: unknown): void {
  try {
    host.storage.local.set(key, JSON.stringify(value));
  } catch {
    /* quota / unavailable — it just won't persist */
  }
}

function remove(host: Host, key: string): void {
  try {
    host.storage.local.remove(key);
  } catch {
    /* nothing to clear */
  }
}

export function readDraft(host: Host): string {
  const parsed = readJson(host, FEEDBACK_DRAFT_KEY) as { message?: unknown } | null;
  return typeof parsed?.message === 'string' ? parsed.message.slice(0, MAX_ITEM_CHARS) : '';
}

export function writeDraft(host: Host, message: string): void {
  if (!message.trim()) remove(host, FEEDBACK_DRAFT_KEY);
  else writeJson(host, FEEDBACK_DRAFT_KEY, { message: message.slice(0, MAX_ITEM_CHARS) });
}

export function clearDraft(host: Host): void {
  remove(host, FEEDBACK_DRAFT_KEY);
}

export function readQueue(host: Host): QueuedFeedback[] {
  const parsed = readJson(host, FEEDBACK_QUEUE_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (i): i is QueuedFeedback =>
        !!i && typeof i.id === 'string' && i.id.length <= 64 && typeof i.message === 'string',
    )
    .slice(0, MAX_QUEUE)
    .map((i) => ({ id: i.id, message: i.message.slice(0, MAX_ITEM_CHARS) }));
}

function writeQueue(host: Host, queue: QueuedFeedback[]): void {
  if (queue.length === 0) remove(host, FEEDBACK_QUEUE_KEY);
  else writeJson(host, FEEDBACK_QUEUE_KEY, queue);
}

/** Persist `message` as a queued item (reusing the id of an identical one). Null when the queue is full. */
export function enqueue(host: Host, message: string): QueuedFeedback | null {
  const queue = readQueue(host);
  const text = message.slice(0, MAX_ITEM_CHARS);
  const existing = queue.find((i) => i.message === text);
  if (existing) return existing;
  if (queue.length >= MAX_QUEUE) return null;
  const item = { id: newId(), message: text };
  writeQueue(host, [...queue, item]);
  return item;
}

export function dequeue(host: Host, id: string): void {
  writeQueue(
    host,
    readQueue(host).filter((i) => i.id !== id),
  );
}

/**
 * Cross-tab / cross-mount single-flight. A lease with expiry in storage;
 * read-back after the write confirms we won (best effort — storage has no CAS).
 */
export function acquireLease(host: Host, owner: string, now = Date.now()): boolean {
  const cur = readJson(host, FEEDBACK_LEASE_KEY) as { owner?: unknown; until?: unknown } | null;
  if (cur && cur.owner !== owner && typeof cur.until === 'number' && cur.until > now) return false;
  writeJson(host, FEEDBACK_LEASE_KEY, { owner, until: now + LEASE_MS });
  const after = readJson(host, FEEDBACK_LEASE_KEY) as { owner?: unknown } | null;
  return after?.owner === owner;
}

export function releaseLease(host: Host, owner: string): void {
  const cur = readJson(host, FEEDBACK_LEASE_KEY) as { owner?: unknown } | null;
  if (cur?.owner === owner) remove(host, FEEDBACK_LEASE_KEY);
}

export type PostResult = { kind: 'sent' } | { kind: 'http'; error: string };

/**
 * POST one queued report. Resolves for ANY HTTP response (2xx → sent, else a
 * user-facing error: never retried); rejects only on a transport failure.
 */
export async function postFeedback(
  host: Host,
  body: { id: string; message: string; location: unknown; hp: string },
): Promise<PostResult> {
  const res = await host.apiFetch({
    method: 'POST',
    path: '/api/feedback',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status >= 200 && res.status < 300) return { kind: 'sent' };
  let error: string | undefined;
  try {
    error = (JSON.parse(res.body) as { error?: string } | null)?.error;
  } catch {
    error = undefined;
  }
  return { kind: 'http', error: error || 'Couldn’t send that — please try again.' };
}
