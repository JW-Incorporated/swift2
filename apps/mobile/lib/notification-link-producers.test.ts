import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deepLinkTarget } from '@swift2/experience';
import { applyDeepLink, type DeepLinkActions, type DeepLinkQueries } from '../dom/bridge/deep-link-apply';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes-instance';
import { resolveDestination } from './destination-resolver';
import { writeCurrentItem, upsertLiveTheory } from '../../worker/src/extract/write-knowledge';
import { emitOfficialMerchEvent } from '../../../scripts/merch-engine/emit-official-merch-event.mjs';
import { emitFanmadeEvent as emitFanmadeRaw } from '../../../scripts/merch-engine/emit-fanmade-event.mjs';

type Emit = (draft: unknown, opts: { db: SupabaseClient }) => Promise<unknown>;
const emitOfficial = emitOfficialMerchEvent as unknown as Emit;
const emitFanmade = emitFanmadeRaw as unknown as Emit;

type Row = Record<string, unknown>;

/** Records every row inserted into `events` (the production insertEvent shape) and answers the other tables generically. */
function recordingDb() {
  const events: Row[] = [];
  const builder = (table: string): unknown =>
    new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'then') return (res: (v: unknown) => void) => res({ data: null, error: null });
        if (prop === 'insert')
          return (row: Row) => {
            if (table === 'events') events.push(row);
            return builder(table);
          };
        if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve({ data: { id: `${table}-1` }, error: null });
        return () => builder(table);
      },
    });
  return { db: { from: (t: string) => builder(t) } as unknown as SupabaseClient, events };
}

const actions = () =>
  Object.fromEntries(
    ['goHome', 'setEra', 'setMode', 'openThread', 'openItem', 'openVideo', 'openSong', 'openTrackGuide', 'openTheoryGuide', 'closeItem', 'closeInbox', 'closeSettings', 'closeTrackGuide', 'closeTheoryGuide', 'setSearchOpen', 'setSelectorOpen'].map((k) => [k, vi.fn()]),
  ) as unknown as Record<keyof DeepLinkActions, ReturnType<typeof vi.fn>>;
const queries: DeepLinkQueries = {
  threadIds: [],
  contentItemId: () => null,
  isEraId: () => false,
  eraHasVideoSlug: () => false,
  findEraForVideoSlug: () => null,
  eraOfTrackKey: () => null,
};

/** Web parser + app resolver + applier on one stored link; returns what each decided. */
function open(link: string) {
  const u = new URL(link);
  const d = resolveDestination(link, { isHostRoute });
  const a = actions();
  const ok = applyDeepLink(new URL(d.path, u.origin).search, queries, a as unknown as DeepLinkActions);
  return { target: deepLinkTarget(u.search, []), dest: d, a, ok };
}

describe('merch producers (real emitted payloads) open merch mode', () => {
  it.each(['official', 'fan-made'])('%s', async (kind) => {
    const { db, events } = recordingDb();
    if (kind === 'official') await emitOfficial({ products: [{ sourceId: '1', item: 'Tee' }] }, { db });
    else await emitFanmade({ products: [{ url: 'https://x.test/a', item: 'Tote' }] }, { db });
    expect(events).toHaveLength(1);
    const { target, dest, a, ok } = open(events[0]!.deep_link as string);
    expect(target).toEqual({ kind: 'mode', mode: 'merch' });
    expect(dest).toEqual({ kind: 'dom', path: '/?mode=merch' });
    expect(ok).toBe(true);
    expect(a.setMode).toHaveBeenCalledWith('merch');
  });
});

describe('news producers (real writeCurrentItem events) never emit a dead vocabulary', () => {
  // current_item rows are not content items (no `?item=` / deep link renders one), so the honest destination is the front door.
  it.each(['release', 'music', 'tour', 'relationship', 'sighting', 'statement', 'award'] as const)('%s -> front door', async (category) => {
    const { db, events } = recordingDb();
    await writeCurrentItem(
      db,
      'story-1',
      'tloas',
      { observedOn: '2026-10-04', category, tags: [], headline: 'h', summary: 's', detail: 'd', symbols: [], entities: [], statusHint: 'confirmed' },
      [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
    );
    expect(events).toHaveLength(1);
    const link = events[0]!.deep_link as string;
    expect(link).not.toMatch(/current=/);
    const { target, dest, ok } = open(link);
    expect(target).toBeNull();
    expect(dest).toEqual({ kind: 'dom', path: '/' });
    expect(ok).toBe(true);
  });

  it('a new live theory event opens the Threads board', async () => {
    const { db, events } = recordingDb();
    await upsertLiveTheory(db, { name: 'n', claim: 'c' } as never, [], '2026-10-04');
    const evt = events.find((e) => e.category === 'easter_egg');
    expect(evt).toBeDefined();
    const { target, dest, a } = open(evt!.deep_link as string);
    expect(target).toEqual({ kind: 'mode', mode: 'threads' });
    expect(dest).toEqual({ kind: 'dom', path: '/?mode=threads' });
    expect(a.setMode).toHaveBeenCalledWith('threads');
  });
});
