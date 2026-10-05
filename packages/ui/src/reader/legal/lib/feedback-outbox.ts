import type { useHost } from '../../../host';

type Host = ReturnType<typeof useHost>;

/** Unsent feedback draft. Local (durable) storage so it survives a relaunch. */
export const FEEDBACK_DRAFT_KEY = 'll-feedback-draft-v1';

export const FEEDBACK_QUEUED_MESSAGE =
  'You’re offline — your report is saved and will send when you’re back online.';
export const FEEDBACK_RESTORED_MESSAGE =
  'Your unsent report was restored — press Send to resend it.';

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function readDraft(host: Host): string {
  try {
    const raw = host.storage.local.get(FEEDBACK_DRAFT_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { message?: unknown };
    return typeof parsed.message === 'string' ? parsed.message : '';
  } catch {
    return '';
  }
}

export function writeDraft(host: Host, message: string): void {
  try {
    host.storage.local.set(FEEDBACK_DRAFT_KEY, JSON.stringify({ message }));
  } catch {
    /* quota / unavailable — the draft just won't persist */
  }
}

export function clearDraft(host: Host): void {
  try {
    host.storage.local.remove(FEEDBACK_DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** POST the report; `ok: false` carries the user-facing reason. Throws on a network failure. */
export async function postFeedback(
  host: Host,
  body: { message: string; location: unknown; hp: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await host.apiFetch({
    method: 'POST',
    path: '/api/feedback',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status >= 200 && res.status < 300) return { ok: true };
  let data: { error?: string };
  try {
    data = JSON.parse(res.body) ?? {};
  } catch {
    data = {};
  }
  return { ok: false, error: data.error || 'Couldn’t send that — please try again.' };
}
