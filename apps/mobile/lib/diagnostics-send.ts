// Posts a `[diag]` report through the existing /api/feedback route, which
// appends it as a comment on the tracking issue. No location, no ids.
import { apiBaseUrl } from './api-base';

export async function sendDiagReport(
  message: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetchImpl(`${apiBaseUrl()}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (res.ok) return { ok: true };
    const data: { error?: string } = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || `Send failed (${res.status}).` };
  } catch {
    return { ok: false, error: 'Network error — please try again.' };
  }
}
