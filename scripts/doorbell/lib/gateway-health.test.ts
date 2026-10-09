import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { GRACE_MS, createGatewayHealth } from './gateway-health.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { connectGateway } from './gateway.mjs';

describe('gateway health state machine', () => {
  let t = 0;
  const make = () => createGatewayHealth({ now: () => t });
  beforeEach(() => { t = 1_000_000; });

  it('feeds through the startup grace, then stops if the gateway never becomes ready', () => {
    const h = make();
    expect(h.shouldFeed()).toBe(true);
    t += GRACE_MS;
    expect(h.shouldFeed()).toBe(true);
    t += 1;
    expect(h.shouldFeed()).toBe(false);
  });

  it('a normal resume stays healthy and keeps feeding', () => {
    const h = make();
    h.hello(41_250);
    h.ready();
    for (let i = 0; i < 10; i += 1) {
      t += 41_250;
      h.ack();
      expect(h.shouldFeed()).toBe(true);
    }
    h.closed();
    t += 1_000;
    expect(h.isHealthy()).toBe(false);
    expect(h.shouldFeed()).toBe(true);
    h.ready();
    t += 41_250;
    h.ack();
    expect(h.isHealthy()).toBe(true);
    t += 600_000;
    h.ack();
    h.ready();
    expect(h.shouldFeed()).toBe(true);
  });

  it('10-04: resuming with no resumed event stops the feed after the grace', () => {
    const h = make();
    h.hello(41_250);
    h.ready();
    t += 41_250;
    h.ack();
    expect(h.shouldFeed()).toBe(true);
    h.closed(); // no heartbeat ack, then closed, then "resuming" forever
    for (let s = 30_000; s <= GRACE_MS; s += 30_000) {
      t += 30_000;
      expect(h.shouldFeed()).toBe(true);
    }
    t += 30_000;
    expect(h.shouldFeed()).toBe(false);
    t += 5_000_000;
    expect(h.shouldFeed()).toBe(false);
  });

  it('a missed heartbeat ack makes it unhealthy, and the feed stops after the grace', () => {
    const h = make();
    h.hello(41_250);
    h.ready();
    const fed: boolean[] = [];
    for (let i = 0; i < 12; i += 1) {
      t += 30_000;
      fed.push(h.shouldFeed());
    }
    // healthy until 82.5 s, then the 120 s grace runs out by ~210 s of silence
    expect(fed.slice(0, 2)).toEqual([true, true]);
    expect(fed.at(-1)).toBe(false);
    expect(fed.indexOf(false)).toBeGreaterThan(4);
  });

  it('an ack arriving before ready does not count as healthy', () => {
    const h = make();
    h.ack();
    expect(h.isHealthy()).toBe(false);
  });
});

class FakeSocket {
  static all: FakeSocket[] = [];
  closedWith: number | null = null;
  sent: Array<{ op: number }> = [];
  private listeners: Record<string, Array<(event: unknown) => void>> = {};
  constructor(public url: string) { FakeSocket.all.push(this); }
  addEventListener(type: string, fn: (event: unknown) => void) { (this.listeners[type] ||= []).push(fn); }
  send(text: string) { this.sent.push(JSON.parse(text)); }
  close(code: number) { this.closedWith = code; }
  frame(payload: object) { for (const fn of this.listeners.message || []) fn({ data: JSON.stringify(payload) }); }
}
const latest = () => FakeSocket.all[FakeSocket.all.length - 1];

describe('gateway feeds health and bounds a stuck connect', () => {
  beforeEach(() => { FakeSocket.all = []; vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it('reports ready and acks, and a stuck resume falls back to a fresh identify', () => {
    const lines: string[] = [];
    const h = createGatewayHealth({ now: () => Date.now() });
    const gw = connectGateway({
      token: 't', intents: 1, onDispatch: () => {}, log: (l: string) => lines.push(l),
      WebSocketImpl: FakeSocket, random: () => 0.5, health: h, connectTimeoutMs: 45_000,
    });
    const first = latest();
    first.frame({ op: 10, d: { heartbeat_interval: 40_000 } });
    first.frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's1', resume_gateway_url: 'wss://resume.discord.gg' } });
    expect(h.isHealthy()).toBe(true);
    first.frame({ op: 7 }); // Discord asks to reconnect; the session stays resumable
    expect(h.isHealthy()).toBe(false);
    vi.advanceTimersByTime(1_000);
    const resume = latest();
    expect(resume).not.toBe(first);
    expect(lines).toContain('gateway: resuming');
    resume.frame({ op: 10, d: { heartbeat_interval: 40_000 } });
    expect(resume.sent.some((f) => f.op === 6)).toBe(true);
    // Neither RESUMED nor a close ever arrives.
    vi.advanceTimersByTime(45_000);
    expect(resume.closedWith).toBe(4000);
    expect(lines.some((l) => l.includes('not ready after 45s'))).toBe(true);
    vi.advanceTimersByTime(2_000);
    expect(lines.filter((l) => l === 'gateway: connecting')).toHaveLength(2);
    const fresh = latest();
    fresh.frame({ op: 10, d: { heartbeat_interval: 40_000 } });
    expect(fresh.sent.some((f) => f.op === 2)).toBe(true);
    fresh.frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's2', resume_gateway_url: 'wss://resume.discord.gg' } });
    expect(h.isHealthy()).toBe(true);
    gw.stop();
  });
});
