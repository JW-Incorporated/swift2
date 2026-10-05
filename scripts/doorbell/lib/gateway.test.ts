import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { BACKOFF_CAP_MS, backoffMs, connectGateway } from './gateway.mjs';

type Frame = { op: number; d?: unknown; s?: number | null; t?: string };

class FakeSocket {
  static all: FakeSocket[] = [];
  sent: Frame[] = [];
  closedWith: number | null = null;
  private listeners: Record<string, Array<(event: unknown) => void>> = {};
  constructor(public url: string) {
    FakeSocket.all.push(this);
  }
  addEventListener(type: string, fn: (event: unknown) => void) {
    (this.listeners[type] ||= []).push(fn);
  }
  send(text: string) {
    this.sent.push(JSON.parse(text));
  }
  close(code: number) {
    this.closedWith = code;
  }
  frame(payload: Frame) {
    for (const fn of this.listeners.message || []) fn({ data: JSON.stringify(payload) });
  }
  serverClose(code: number) {
    for (const fn of this.listeners.close || []) fn({ code });
  }
}

const latest = () => FakeSocket.all[FakeSocket.all.length - 1];

function start(over: Record<string, unknown> = {}) {
  const lines: string[] = [];
  const dispatched: string[] = [];
  const onFatal = vi.fn();
  const gw = connectGateway({
    token: 'discord-secret', intents: 513, onDispatch: (t: string) => dispatched.push(t), onFatal,
    log: (l: string) => lines.push(l), WebSocketImpl: FakeSocket, random: () => 0.5, ...over,
  });
  return { gw, lines, dispatched, onFatal };
}

beforeEach(() => {
  FakeSocket.all = [];
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('connectGateway', () => {
  it('identifies with the given intents, then heartbeats on the hello interval', () => {
    start();
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    expect(latest().sent[0]).toMatchObject({ op: 2, d: { token: 'discord-secret', intents: 513 } });
    vi.advanceTimersByTime(499);
    expect(latest().sent).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(latest().sent[1]).toEqual({ op: 1, d: null });
    latest().frame({ op: 11 });
    latest().frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's1', resume_gateway_url: 'wss://gateway-us-east1-b.discord.gg' } });
    vi.advanceTimersByTime(1000);
    expect(latest().sent[2]).toEqual({ op: 1, d: 1 });
  });

  it('resumes the session after a drop instead of identifying again', () => {
    const { dispatched } = start();
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    latest().frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's1', resume_gateway_url: 'wss://gateway-us-east1-b.discord.gg' } });
    latest().frame({ op: 0, t: 'MESSAGE_CREATE', s: 7, d: {} });
    latest().serverClose(1006);
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.all).toHaveLength(2);
    expect(latest().url).toBe('wss://gateway-us-east1-b.discord.gg/?v=10&encoding=json');
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    expect(latest().sent[0]).toEqual({ op: 6, d: { token: 'discord-secret', session_id: 's1', seq: 7 } });
    expect(dispatched).toEqual(['READY', 'MESSAGE_CREATE']);
  });

  it('treats a missing heartbeat ack as a dead connection and reconnects', () => {
    start();
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    vi.advanceTimersByTime(500); // first beat, never acked
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.all[0].closedWith).toBe(4000);
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.all).toHaveLength(2);
  });

  it('backs off 1 s, 2 s, 4 s … capped at 60 s while connections keep failing', () => {
    start();
    const waits: number[] = [];
    for (let i = 0; i < 9; i += 1) {
      const before = FakeSocket.all.length;
      latest().serverClose(1006);
      let waited = 0;
      while (FakeSocket.all.length === before) {
        vi.advanceTimersByTime(1000);
        waited += 1000;
      }
      waits.push(waited);
    }
    expect(waits).toEqual([1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000]);
    expect(backoffMs(20)).toBe(BACKOFF_CAP_MS);
  });

  it('identifies afresh after a non-resumable invalid session', () => {
    start();
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    latest().frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's1', resume_gateway_url: 'wss://gateway-us-east1-b.discord.gg' } });
    latest().frame({ op: 9, d: false });
    vi.advanceTimersByTime(1000);
    expect(latest().url).toBe('wss://gateway.discord.gg/?v=10&encoding=json');
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    expect(latest().sent[0].op).toBe(2);
  });

  it('stops for good on a bad token or disallowed intents, and never logs the token', () => {
    const { onFatal, lines } = start();
    latest().serverClose(4004);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(FakeSocket.all).toHaveLength(1);
    expect(onFatal).toHaveBeenCalledWith(4004);
    expect(lines.join('\n')).not.toContain('discord-secret');
  });

  it('stop() closes cleanly and never reconnects', () => {
    const { gw } = start();
    gw.stop();
    latest().serverClose(1000);
    vi.advanceTimersByTime(120_000);
    expect(FakeSocket.all).toHaveLength(1);
    expect(FakeSocket.all[0].closedWith).toBe(1000);
  });

  it('keeps a heartbeat interval from Discord between 1 s and 5 min (CodeQL js/resource-exhaustion)', () => {
    const fast = start();
    const quick = latest();
    quick.frame({ op: 10, d: { heartbeat_interval: 10 } });
    vi.advanceTimersByTime(499);
    expect(quick.sent).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(quick.sent[1]).toEqual({ op: 1, d: null });
    fast.gw.stop();
    start();
    const slow = latest();
    slow.frame({ op: 10, d: { heartbeat_interval: 1e12 } });
    vi.advanceTimersByTime(149_999);
    expect(slow.sent).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(slow.sent[1]).toEqual({ op: 1, d: null });
  });

  it('resumes only on a Discord gateway host; any other resume URL identifies afresh (CodeQL js/request-forgery)', () => {
    start();
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    latest().frame({ op: 0, t: 'READY', s: 1, d: { session_id: 's1', resume_gateway_url: 'wss://evil.example/x.discord.gg' } });
    latest().serverClose(1006);
    vi.advanceTimersByTime(1000);
    expect(latest().url).toBe('wss://gateway.discord.gg/?v=10&encoding=json');
    latest().frame({ op: 10, d: { heartbeat_interval: 1000 } });
    expect(latest().sent[0].op).toBe(2);
  });
});
