import { describe, expect, it, vi } from 'vitest';
import { parseDiagReport } from '../../web/app/api/feedback/diag';
import {
  MAX_PENDING,
  createTelemetry,
  enqueueReport,
  parseReportState,
  reportPayload,
  type PendingReport,
  type ReportState,
} from './watchdog-telemetry';
import { WATCHDOG_REASONS } from './watchdog-policy';

const env = { model: 'Pixel 8', os: 'android 15', build: '1.0.0 (42)', updateId: 'embedded' };
const rep = (over: Partial<PendingReport> = {}): PendingReport => ({
  kind: 'watchdog-fallback',
  category: 'ready-timeout',
  buildKey: '42:embedded',
  env,
  ...over,
});

function harness(online = true) {
  let raw: string | null = null;
  const sent: unknown[] = [];
  const send = vi.fn(async (p: unknown) => {
    if (!online) return { ok: false };
    sent.push(p);
    return { ok: true };
  });
  const t = createTelemetry({
    load: async () => raw,
    save: async (r) => {
      raw = r;
    },
    send,
    env: () => env,
  });
  return { t, sent, send, state: () => parseReportState(raw) };
}

describe('report payload', () => {
  it.each(WATCHDOG_REASONS)('category %s is accepted by the strict server schema and carries no free text', (category) => {
    const p = reportPayload(rep({ category }));
    const parsed = parseDiagReport(p.diag);
    expect(parsed.ok).toBe(true);
    expect(Object.keys(p.diag.timings).sort()).toEqual(
      ['at:watchdog-fallback', 'at:wd-' + category, 'watchdog-fallback', 'wd-' + category].sort(),
    );
    expect(Object.keys(p.diag.timings).every((k) => /^(at:)?(watchdog-(fallback|quarantine)|wd-[a-z-]+)$/.test(k))).toBe(true);
    expect(Object.values(p.diag.timings).every((v) => v === 0)).toBe(true);
  });

  it('a hostile category or free-text reason cannot reach the payload', () => {
    const p = reportPayload(rep({ category: 'dom-error: secret token abc' as never }));
    expect(Object.keys(p.diag.timings)).not.toContain('wd-dom-error: secret token abc');
  });
});

describe('queue', () => {
  it('enqueues once per kind per buildKey and caps at 3', () => {
    let s: ReportState = { pending: [], sent: [] };
    s = enqueueReport(s, rep());
    expect(enqueueReport(s, rep())).toBe(s);
    s = enqueueReport(s, rep({ kind: 'watchdog-quarantine' }));
    s = enqueueReport(s, rep({ buildKey: '43:x' }));
    s = enqueueReport(s, rep({ buildKey: '44:x' }));
    expect(s.pending).toHaveLength(MAX_PENDING);
    expect(s.pending[0].kind).toBe('watchdog-quarantine');
  });

  it('parse drops malformed entries and never throws', () => {
    expect(parseReportState('{nope')).toEqual({ pending: [], sent: [] });
    const raw = JSON.stringify({ pending: [rep(), { kind: 'x' }, rep({ category: 'free text' as never })], sent: ['a', 5] });
    expect(parseReportState(raw)).toEqual({ pending: [rep()], sent: ['a'] });
  });
});

describe('telemetry', () => {
  it('sends when online, and never reports the same kind+buildKey twice', async () => {
    const h = harness();
    await h.t.report('watchdog-fallback', 'ready-timeout', '42:embedded', true);
    await h.t.report('watchdog-fallback', 'ready-timeout', '42:embedded', true);
    expect(h.sent).toHaveLength(1);
    expect(h.state().pending).toEqual([]);
    await h.t.report('watchdog-quarantine', 'ready-timeout', '42:embedded', true);
    expect(h.sent).toHaveLength(2);
  });

  it('offline: keeps the report pending, and the next flush sends it', async () => {
    const off = harness(false);
    await off.t.report('watchdog-quarantine', 'dom-error', '42:embedded', true);
    expect(off.state().pending).toHaveLength(1);
    expect(off.sent).toHaveLength(0);
  });

  it('flush after reconnect delivers exactly once', async () => {
    let online = false;
    let raw: string | null = null;
    const sent: unknown[] = [];
    const t = createTelemetry({
      load: async () => raw,
      save: async (r) => {
        raw = r;
      },
      send: async (p) => (online ? (sent.push(p), { ok: true }) : { ok: false }),
      env: () => env,
    });
    await t.report('watchdog-quarantine', 'protocol', '42:embedded', true);
    online = true;
    await t.flush(true);
    await t.flush(true);
    expect(sent).toHaveLength(1);
  });

  it('watchdogReports:false enqueues nothing and drops what is pending', async () => {
    const h = harness(false);
    await h.t.report('watchdog-fallback', 'dom-error', '42:embedded', false);
    expect(h.state().pending).toEqual([]);
    await h.t.report('watchdog-fallback', 'dom-error', '42:embedded', true);
    expect(h.state().pending).toHaveLength(1);
    await h.t.flush(false);
    expect(h.state().pending).toEqual([]);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('a throwing store or network is swallowed', async () => {
    const t = createTelemetry({
      load: async () => {
        throw new Error('x');
      },
      save: async () => {
        throw new Error('x');
      },
      send: async () => {
        throw new Error('x');
      },
      env: () => env,
    });
    await expect(t.report('watchdog-fallback', 'dom-error', 'k', true)).resolves.toBeUndefined();
    await expect(t.flush(true)).resolves.toBeUndefined();
  });
});
