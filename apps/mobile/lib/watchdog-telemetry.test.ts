import { describe, expect, it, vi } from 'vitest';
import { parseWatchdogReport } from '../../web/app/api/feedback/watchdog-report';
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

const rep = (over: Partial<PendingReport> = {}): PendingReport => ({
  category: 'ready-timeout',
  buildKey: '42:embedded',
  ...over,
});

function harness(online = true, start = 1_000_000) {
  let raw: string | null = null;
  let t = start;
  const sent: unknown[] = [];
  const send = vi.fn(async (p: unknown) => {
    if (!online) return { ok: false };
    sent.push(p);
    return { ok: true };
  });
  const tel = createTelemetry({
    load: async () => raw,
    save: async (r) => {
      raw = r;
    },
    send,
    platform: () => 'android',
    now: () => t,
  });
  return { t: tel, sent, send, state: () => parseReportState(raw), advance: (ms: number) => (t += ms) };
}

describe('report payload', () => {
  it.each(WATCHDOG_REASONS)('category %s is accepted by the strict server schema', (category) => {
    const p = reportPayload(rep({ category }), 'ios');
    expect(parseWatchdogReport(p.watchdog).ok).toBe(true);
  });

  it('carries only platform, buildKey and category: no model, OS, updateId or timings', () => {
    const p = reportPayload(rep(), 'android');
    expect(p).toEqual({ message: '[watchdog]', watchdog: { platform: 'android', buildKey: '42:embedded', category: 'ready-timeout' } });
    expect(JSON.stringify(p)).not.toMatch(/model|timings|updateId/);
  });

  it('a hostile category cannot become a valid report', () => {
    const p = reportPayload(rep({ category: 'dom-error: secret token abc' as never }), 'ios');
    expect(parseWatchdogReport(p.watchdog).ok).toBe(false);
  });
});

describe('queue', () => {
  it('enqueues once per buildKey and caps at 3', () => {
    let s: ReportState = { pending: [], sent: [] };
    s = enqueueReport(s, rep());
    expect(enqueueReport(s, rep())).toBe(s);
    s = enqueueReport(s, rep({ buildKey: '43:x' }));
    s = enqueueReport(s, rep({ buildKey: '44:x' }));
    s = enqueueReport(s, rep({ buildKey: '45:x' }));
    expect(s.pending).toHaveLength(MAX_PENDING);
    expect(s.pending[0].buildKey).toBe('43:x');
  });

  it('parse drops malformed entries and never throws', () => {
    expect(parseReportState('{nope')).toEqual({ pending: [], sent: [] });
    const raw = JSON.stringify({
      pending: [rep(), { category: 'x' }, rep({ category: 'free text' as never })],
      sent: [{ buildKey: 'a', at: 1 }, 5, { buildKey: 'b', at: 'x' }],
    });
    expect(parseReportState(raw)).toEqual({ pending: [rep()], sent: [{ buildKey: 'a', at: 1 }] });
  });
});

describe('telemetry', () => {
  it('sends once per buildKey+category, ever (marks never expire)', async () => {
    const h = harness();
    await h.t.report('ready-timeout', '42:embedded', true);
    await h.t.report('ready-timeout', '42:embedded', true);
    expect(h.sent).toHaveLength(1);
    expect(h.state().pending).toEqual([]);
    h.advance(400 * 24 * 60 * 60 * 1000);
    await h.t.report('ready-timeout', '42:embedded', true);
    expect(h.sent).toHaveLength(1);
    await h.t.report('protocol', '42:embedded', true);
    expect(h.sent).toHaveLength(2);
  });

  it('a legacy mark without a category covers the whole buildKey', () => {
    const raw = JSON.stringify({ pending: [], sent: [{ buildKey: '42:embedded', at: 1 }] });
    expect(enqueueReport(parseReportState(raw), rep({ category: 'protocol' })).pending).toEqual([]);
  });

  it('the throttle survives a restart (it is persisted, not in memory)', async () => {
    let raw: string | null = null;
    const sent: unknown[] = [];
    const make = () =>
      createTelemetry({
        load: async () => raw,
        save: async (r) => {
          raw = r;
        },
        send: async (p) => (sent.push(p), { ok: true }),
        platform: () => 'ios',
        now: () => 5,
      });
    await make().report('dom-error', '42:embedded', true);
    await make().report('dom-error', '42:embedded', true);
    expect(sent).toHaveLength(1);
  });

  it('keeps the mark for the first key after 7+ distinct keys in one day', async () => {
    const h = harness();
    for (let i = 0; i < 8; i += 1) await h.t.report('dom-error', `${40 + i}:embedded`, true);
    expect(h.sent).toHaveLength(8);
    await h.t.report('dom-error', '40:embedded', true);
    expect(h.sent).toHaveLength(8);
  });

  it('a different buildKey is not throttled by another', async () => {
    const h = harness();
    await h.t.report('dom-error', '42:embedded', true);
    await h.t.report('dom-error', '43:embedded', true);
    expect(h.sent).toHaveLength(2);
  });

  it('offline: keeps the report pending, and the next flush sends it', async () => {
    const off = harness(false);
    await off.t.report('dom-error', '42:embedded', true);
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
      platform: () => 'android',
      now: () => 1,
    });
    await t.report('protocol', '42:embedded', true);
    online = true;
    await t.flush(true);
    await t.flush(true);
    expect(sent).toHaveLength(1);
  });

  it('disabled (the default) enqueues nothing and drops what is pending', async () => {
    const h = harness(false);
    await h.t.report('dom-error', '42:embedded', false);
    expect(h.state().pending).toEqual([]);
    await h.t.report('dom-error', '42:embedded', true);
    expect(h.state().pending).toHaveLength(1);
    await h.t.flush(false);
    expect(h.state().pending).toEqual([]);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('a throwing store or network is swallowed', async () => {
    const boom = async () => {
      throw new Error('x');
    };
    const t = createTelemetry({ load: boom, save: boom, send: boom, platform: () => 'ios', now: () => 1 });
    await expect(t.report('dom-error', 'k', true)).resolves.toBeUndefined();
    await expect(t.flush(true)).resolves.toBeUndefined();
  });
});
