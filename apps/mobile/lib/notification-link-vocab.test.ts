import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deepLinkTarget, resolveTrackKey, setTracksRawProvider, trackKey } from '@swift2/experience';
import { dispatchFunNotifications } from '../../../packages/core/src/notification-fun';
import * as sender from '../../../packages/core/src/notification-sender';
import { frontDoorLink, merchLink, songLink, theoriesBoardLink } from '@swift2/shared';
import { applyDeepLink, type DeepLinkActions, type DeepLinkQueries } from '../dom/bridge/deep-link-apply';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes-instance';
import { resolveDestination } from './destination-resolver';

afterEach(() => vi.restoreAllMocks());

setTracksRawProvider({ fearless: [{ title: 'Fearless', note: 'n', trackNumber: 1, slug: 'fearless' }] });
const KEY = trackKey('fearless', { title: 'Fearless', trackNumber: 1 });

const actions = () =>
  Object.fromEntries(
    ['goHome', 'setEra', 'setMode', 'openThread', 'openItem', 'openVideo', 'openSong', 'openTrackGuide', 'openTheoryGuide', 'closeItem', 'closeInbox', 'closeSettings', 'closeTrackGuide', 'closeTheoryGuide', 'setSearchOpen', 'setSelectorOpen'].map((k) => [k, vi.fn()]),
  ) as unknown as Record<keyof DeepLinkActions, ReturnType<typeof vi.fn>>;
const queries: DeepLinkQueries = {
  threadIds: [],
  contentItemId: () => null,
  isEraId: (id) => id === 'fearless',
  eraHasVideoSlug: () => false,
  findEraForVideoSlug: () => null,
  eraOfTrackKey: (k) => resolveTrackKey(k)?.eraId ?? null,
};

function lyricLinkFromDispatch(): Promise<string> {
  const rows: Record<string, unknown[]> = {
    notification_prefs: [{ device_id: 'd1', category: 'lyric_of_day', cadence: 'daily' }],
    devices: [{ id: 'd1', push_token: 't', tz: 'America/Los_Angeles', digest_hour: 9, master_enabled: true }],
    lyrics: [{ id: 1, slug: 'fearless', song: 'Fearless', album: 'Fearless', lyric: 'x', verified: true }],
    on_this_day: [],
  };
  const builder = (table: string): unknown =>
    new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'then') return (res: (v: unknown) => void) => res({ data: rows[table] ?? [], count: 0, error: null });
        if (prop === 'insert' || prop === 'upsert') return () => Promise.resolve({ data: null, error: null });
        return () => builder(table);
      },
    });
  const db = { from: (t: string) => builder(t) } as unknown as SupabaseClient;
  const spy = vi.spyOn(sender, 'sendPushBatch').mockResolvedValue([{ ok: true, deviceId: 'd1', deliveryToken: 'x' }]);
  return dispatchFunNotifications(db, new Date('2026-01-15T20:00:00Z'), {
    trackKeyForSlug: (slug) => (slug === 'fearless' ? KEY : null),
  }).then(() => spy.mock.calls[0]![0][0]!.deepLink);
}

describe('producer links open the intended destination (web parser + app resolver + applier)', () => {
  it('lyric_of_day (production dispatch) -> the song dossier', async () => {
    const link = await lyricLinkFromDispatch();
    expect(link).toBe(songLink(KEY));
    const u = new URL(link);
    expect(deepLinkTarget(u.search, [])).toEqual({ kind: 'song', key: KEY });
    const d = resolveDestination(link, { isHostRoute });
    expect(d.kind).toBe('dom');
    const a = actions();
    expect(applyDeepLink(new URL(d.path, u.origin).search, queries, a as unknown as DeepLinkActions)).toBe(true);
    expect(a.openSong).toHaveBeenCalledWith('fearless', KEY);
  });

  it('live theories / clown report -> the Threads eggs board', () => {
    const link = theoriesBoardLink();
    expect(deepLinkTarget(new URL(link).search, [])).toEqual({ kind: 'mode', mode: 'threads' });
    const d = resolveDestination(link, { isHostRoute });
    expect(d).toEqual({ kind: 'dom', path: '/?mode=threads' });
    const a = actions();
    applyDeepLink(new URL(d.path, link).search, queries, a as unknown as DeepLinkActions);
    expect(a.setMode).toHaveBeenCalledWith('threads');
  });

  it('merch -> merch mode', () => {
    const link = merchLink();
    expect(deepLinkTarget(new URL(link).search, [])).toEqual({ kind: 'mode', mode: 'merch' });
    const d = resolveDestination(link, { isHostRoute });
    expect(d).toEqual({ kind: 'dom', path: '/?mode=merch' });
    const a = actions();
    applyDeepLink(new URL(d.path, link).search, queries, a as unknown as DeepLinkActions);
    expect(a.setMode).toHaveBeenCalledWith('merch');
  });

  it('countdowns -> the front door (the banner lives on the landing)', () => {
    const link = frontDoorLink();
    expect(deepLinkTarget(new URL(link).search, [])).toBeNull();
    expect(resolveDestination(link, { isHostRoute })).toEqual({ kind: 'dom', path: '/' });
  });
});
