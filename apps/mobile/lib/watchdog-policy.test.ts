import { describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_LAUNCHES,
  READY_TIMEOUT_MS,
  createAttemptMonitor,
  decideMount,
  freshRecord,
  markReady,
  parseRecord,
  recordStrike,
  shouldMountDom,
  type WatchdogRecord,
} from './watchdog';
import {
  PENDING_MAX_MS,
  QUARANTINE_AFTER_FALLBACK_CYCLES,
  armPendingBound,
  reasonCategory,
  resolveWantsDom,
  watchdogLines,
} from './watchdog-policy';
import { drillTable, runDrill } from './watchdog-drill';

const KEY = '42:embedded';

describe('record upgrade', () => {
  it('a record persisted before WP2.14 parses with fallbackCycles 0', () => {
    const { fallbackCycles: _c, ...legacy } = recordStrike(freshRecord(KEY, 1), 'boom', 2).record;
    expect(parseRecord(JSON.stringify(legacy))?.fallbackCycles).toBe(0);
  });

  it('a malformed record is fresh, a quarantined one round-trips', () => {
    expect(parseRecord('{"v":1,"state":"quarantined"}')).toBeNull();
    const q: WatchdogRecord = { ...freshRecord(KEY, 1), state: 'quarantined', fallbackCycles: 2 };
    expect(parseRecord(JSON.stringify(q))).toEqual(q);
  });
});

describe('quarantine', () => {
  it('strike 2 owes one fallback; the 2nd fallback cycle in a buildKey quarantines', () => {
    const s1 = recordStrike(freshRecord(KEY, 0), 'a', 1).record;
    const s2 = recordStrike(s1, 'b', 2).record;
    expect(s2).toMatchObject({ state: 'fallback', fallbackCycles: 1, fallbackLaunchesRemaining: FALLBACK_LAUNCHES });
    const fb = decideMount(s2, KEY, 3).record;
    const t1 = recordStrike(recordStrike(decideMount(fb, KEY, 4).record, 'a', 5).record, 'b', 6).record;
    expect(QUARANTINE_AFTER_FALLBACK_CYCLES).toBe(2);
    expect(t1).toMatchObject({ state: 'quarantined', fallbackCycles: 2, fallbackLaunchesRemaining: 0 });
  });

  it('is native with no attempt on the next 5 launches', () => {
    const rows = runDrill('hang', { launches: 10 });
    expect(rows.slice(5, 10).every((r) => r.skipped && r.mount === 'native' && r.source === 'quarantine')).toBe(true);
    expect(rows[9].state).toBe('quarantined');
  });

  it('a new buildKey clears it', () => {
    const q = { ...freshRecord(KEY, 1), state: 'quarantined' as const, fallbackCycles: 2 };
    expect(decideMount(q, KEY, 2).fallbackActive).toBe(true);
    const d = decideMount(q, '43:embedded', 3);
    expect(d.fallbackActive).toBe(false);
    expect(d.record).toEqual(freshRecord('43:embedded', 3));
  });

  it('Reset (no record) clears it', () => {
    expect(decideMount(parseRecord(null), KEY, 1).fallbackActive).toBe(false);
  });

  it('a ready launch resets the cycles', () => {
    const cycled = { ...freshRecord(KEY, 1), fallbackCycles: 1, state: 'attempting' as const };
    const ready = markReady(cycled, 2);
    expect(ready.fallbackCycles).toBe(0);
    expect(decideMount(ready, KEY, 3).record.fallbackCycles).toBe(0);
  });

  it('keeps the quarantined record', () => {
    const q = { ...freshRecord(KEY, 1), state: 'quarantined' as const, fallbackCycles: 2, lastReason: 'ready-timeout' };
    const d = decideMount(q, KEY, 9);
    expect(d.record).toMatchObject({ state: 'quarantined', lastReason: 'ready-timeout', at: 9 });
  });
});

describe('the remote-flag loop is bounded', () => {
  it('9 failing launches under the remote flag make exactly 4 DOM attempts (was 6)', () => {
    const rows = runDrill('hang', { launches: 9, cachedSharedUi: true });
    expect(rows.filter((r) => !r.skipped).length).toBe(4);
    expect(rows.reduce((n, r) => n + r.burnedMs, 0)).toBe(4 * READY_TIMEOUT_MS);
    expect(rows.map((r) => r.outcome)).toEqual([
      'strike', 'strike', 'skipped', 'strike', 'strike', 'skipped', 'skipped', 'skipped', 'skipped',
    ]);
  });

  it.each(['hang', 'throw', 'terminated', 'render-gone', 'protocol', 'abandon'] as const)(
    'failure mode %s ends quarantined with 4 or fewer attempts per bad build',
    (mode) => {
      const rows = runDrill(mode, { launches: 14 });
      expect(rows[13].state).toBe('quarantined');
      expect(rows.filter((r) => !r.skipped).length).toBeLessThanOrEqual(8);
      expect(rows.slice(-3).every((r) => r.skipped)).toBe(true);
    },
  );

  it('a healthy DOM is never quarantined', () => {
    const rows = runDrill('none', { launches: 6 });
    expect(rows.every((r) => r.outcome === 'ready' && r.mount === 'dom')).toBe(true);
  });

  it('prints a readable drill table', () => {
    const lines = drillTable(runDrill('throw', { launches: 6 }));
    expect(lines[0]).toContain('#1 native');
    expect(lines.join('\n')).toContain('dom-error');
  });
});

describe('launch precedence: quarantine > cache > default', () => {
  const rows: [string, boolean, boolean | null, boolean, boolean, string][] = [
    ['quarantine beats cache', true, true, true, false, 'quarantine'],
    ['cache on beats default off', false, true, false, true, 'cache'],
    ['cache OFF beats default ON (kill switch)', false, false, true, false, 'cache'],
    ['no cache: default on', false, null, true, true, 'default'],
    ['no cache: default off', false, null, false, false, 'default'],
  ];
  it.each(rows)('%s', (_n, quarantined, cachedSharedUi, defaultSharedUi, wantsDom, source) => {
    expect(resolveWantsDom({ quarantined, cachedSharedUi, defaultSharedUi })).toEqual({ wantsDom, source });
  });

  it('a quarantined build is native in the drill even with the cache on', () => {
    const rows2 = runDrill('hang', { launches: 8, cachedSharedUi: true });
    expect(rows2[7]).toMatchObject({ mount: 'native', skipped: true, source: 'quarantine' });
  });

  it('the cache says off while the default says on: native on every launch', () => {
    const r = runDrill('none', { launches: 3, cachedSharedUi: false, defaultSharedUi: true });
    expect(r.every((x) => x.mount === 'native' && x.source === 'cache')).toBe(true);
  });

  it('a network result is not an input: the decision is a pure function of local state', () => {
    const a = resolveWantsDom({ quarantined: false, cachedSharedUi: false, defaultSharedUi: false });
    expect(a.wantsDom).toBe(false);
  });
});

describe('pending bound', () => {
  it('fires native after 1500 ms when nothing resolved, and can be cancelled', () => {
    expect(PENDING_MAX_MS).toBe(1500);
    let fire: (() => void) | null = null;
    let ms = 0;
    const cleared = vi.fn();
    const onExpire = vi.fn();
    const cancel = armPendingBound(
      { setTimeout: (fn, t) => ((fire = fn), (ms = t), 7), clearTimeout: cleared },
      onExpire,
    );
    expect(ms).toBe(1500);
    fire!();
    expect(onExpire).toHaveBeenCalledTimes(1);
    cancel();
    expect(cleared).toHaveBeenCalledWith(7);
  });
});

describe('reason categories and protocol-fatal', () => {
  it('maps every strike reason to a fixed category', () => {
    expect(reasonCategory('ready-timeout')).toBe('ready-timeout');
    expect(reasonCategory('dom-error: TypeError x is not a function')).toBe('dom-error');
    expect(reasonCategory('webview-terminated')).toBe('webview-terminated');
    expect(reasonCategory('webview-render-gone')).toBe('webview-render-gone');
    expect(reasonCategory('abandoned-repeated')).toBe('abandoned');
    expect(reasonCategory('protocol-fatal')).toBe('protocol');
    expect(reasonCategory('anything else')).toBe('dom-error');
  });

  it('protocol-fatal is a strike, even after ready, once per launch', () => {
    const onStrike = vi.fn();
    const m = createAttemptMonitor({
      now: () => 0,
      active: true,
      onReady: vi.fn(),
      onStrike,
      scheduler: { setTimeout: () => 1, clearTimeout: () => undefined },
    });
    m.ready();
    m.protocolFatal();
    m.protocolFatal();
    expect(onStrike).toHaveBeenCalledTimes(1);
    expect(reasonCategory(onStrike.mock.calls[0][0])).toBe('protocol');
    expect(recordStrike({ ...freshRecord(KEY, 0), state: 'attempting' }, onStrike.mock.calls[0][0], 1).record.strikes).toBe(1);
    expect(shouldMountDom(true, decideMount(null, KEY, 1))).toBe(true);
  });
});

describe('Diagnostics lines', () => {
  it('shows cycles and quarantined', () => {
    const q = { ...freshRecord(KEY, 1), state: 'quarantined' as const, fallbackCycles: 2 };
    expect(watchdogLines(q)).toContain('Quarantined: yes');
    expect(watchdogLines(q)).toContain('Fallback cycles: 2 of 2');
    expect(watchdogLines(null)).toEqual(['Watchdog: no record']);
  });
});

describe('native mount reason', () => {
  it('names the local cause and renders the Diagnostics line', async () => {
    const { nativeReasonFor, mountLine } = await import('./watchdog-policy');
    expect(nativeReasonFor({ wantsDom: false, source: 'quarantine' }, true)).toBe('quarantine');
    expect(nativeReasonFor({ wantsDom: false, source: 'cache' }, false)).toBe('flag-off');
    expect(nativeReasonFor({ wantsDom: true, source: 'cache' }, true)).toBe('watchdog-fallback');
    expect(mountLine('native', 'dom-strike', null)).toBe('Mount: native (dom-strike)');
    expect(mountLine('dom', null, 'cache')).toBe('Mount: shared UI (cache)');
    expect(mountLine('pending', null, null)).toBe('Mount: pending');
  });
});
