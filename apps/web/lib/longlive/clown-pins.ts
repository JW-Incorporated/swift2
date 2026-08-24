/**
 * Clownbot pinned theories (PLAN.md Stage 11) — a simple user-scoped
 * pin/unpin over `live_theory` ids. No route currently calls this (no pin
 * UI exists yet); it ships as a self-contained, tested library so the
 * schema + code are complete per this stage's brief, same "code complete,
 * feature-flagged off" posture as everything else here — every function
 * degrades to a no-op / empty list when `session` is `null`.
 */
import type { ClownSession } from './clown-session';
import { clownAuthHeaders, clownMemoryEnv } from './clown-session';

export async function pinTheory(session: ClownSession | null, liveTheoryId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (!session) return;
  const env = clownMemoryEnv();
  if (!env) return;
  await fetchImpl(`${env.supabaseUrl}/rest/v1/clown_pinned_theory`, {
    method: 'POST',
    headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({ user_id: session.userId, live_theory_id: liveTheoryId }),
  });
}

export async function unpinTheory(session: ClownSession | null, liveTheoryId: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (!session) return;
  const env = clownMemoryEnv();
  if (!env) return;
  await fetchImpl(
    `${env.supabaseUrl}/rest/v1/clown_pinned_theory?user_id=eq.${session.userId}&live_theory_id=eq.${liveTheoryId}`,
    { method: 'DELETE', headers: clownAuthHeaders(env, session) },
  );
}

export async function listPinnedTheories(session: ClownSession | null, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  if (!session) return [];
  const env = clownMemoryEnv();
  if (!env) return [];
  const res = await fetchImpl(
    `${env.supabaseUrl}/rest/v1/clown_pinned_theory?select=live_theory_id&user_id=eq.${session.userId}`,
    { headers: clownAuthHeaders(env, session) },
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{ live_theory_id?: unknown }>;
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => r.live_theory_id).filter((id): id is string => typeof id === 'string');
}
