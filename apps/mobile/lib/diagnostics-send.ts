// Posts a `[diag]` report through the existing /api/feedback route, which
// builds the tracking-issue comment from the validated fields. No location, no ids.
import { apiBaseUrl } from './api-base';
import type { DiagPayload } from './diagnostics';
import type { WatchdogPayload } from './watchdog-telemetry';

export async function sendDiagReport(
  payload: DiagPayload | WatchdogPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const res = await fetchImpl(`${apiBaseUrl()}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    const data: { error?: string } = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, error: data.error || `Send failed (${res.status}).` };
  } catch {
    return { ok: false, error: 'Network error — please try again.' };
  }
}
