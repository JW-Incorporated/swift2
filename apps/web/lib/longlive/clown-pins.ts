/**
 * Clownbot pinned theories (PLAN.md Stage 11) — a simple user-scoped
 * pin/unpin over `live_theory` ids. No route currently calls this (no pin
 * UI exists yet); it ships as a self-contained, tested library so the
 * schema + code are complete per this stage's brief, same "code complete,
 * feature-flagged off" posture as everything else here — every function
 * degrades to a no-op / empty list when `session` is `null`.
 */
import type { ClownSession } from './clown-session';
import { createClownDbClient } from './clown-session';

export async function pinTheory(session: ClownSession | null, liveTheoryId: string, signal?: AbortSignal): Promise<void> {
  if (!session) return;
  const db = createClownDbClient(session);
  if (!db) return;
  // `ignoreDuplicates: true` is the typed-client equivalent of the old raw
  // fetch's `Prefer: resolution=ignore-duplicates` header — `unique
  // (user_id, live_theory_id)` (20260904000000_clown_sessions.sql) is the
  // conflict target either way.
  let query_ = db
    .from('clown_pinned_theory')
    .upsert(
      { user_id: session.userId, live_theory_id: liveTheoryId },
      { onConflict: 'user_id,live_theory_id', ignoreDuplicates: true },
    );
  if (signal) query_ = query_.abortSignal(signal);
  await query_;
}

export async function unpinTheory(session: ClownSession | null, liveTheoryId: string, signal?: AbortSignal): Promise<void> {
  if (!session) return;
  const db = createClownDbClient(session);
  if (!db) return;
  let query_ = db.from('clown_pinned_theory').delete().eq('user_id', session.userId).eq('live_theory_id', liveTheoryId);
  if (signal) query_ = query_.abortSignal(signal);
  await query_;
}

export async function listPinnedTheories(session: ClownSession | null, signal?: AbortSignal): Promise<string[]> {
  if (!session) return [];
  const db = createClownDbClient(session);
  if (!db) return [];
  let query_ = db.from('clown_pinned_theory').select('live_theory_id').eq('user_id', session.userId);
  if (signal) query_ = query_.abortSignal(signal);
  const { data, error } = await query_;
  if (error || !data) return [];
  return (data as Array<{ live_theory_id?: unknown }>)
    .map((r) => r.live_theory_id)
    .filter((id): id is string => typeof id === 'string');
}
