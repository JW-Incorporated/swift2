import { describe, expect, it, vi } from 'vitest';
import type { ResResult } from '@swift2/ui';
import { BACK_ESCAPE_WINDOW_MS, createBackHandler } from './bridge-handlers-ui';

type Answer = ResResult<'handled' | 'exit'> | 'reject';
const HANDLED: Answer = { ok: true, value: 'handled' };
const EXIT: Answer = { ok: true, value: 'exit' };
const TIMEOUT: Answer = { ok: false, error: { code: 'timeout', message: 'back timed out' } };
const FAILED: Answer = { ok: false, error: { code: 'failed', message: 'responder threw' } };
const UNSUPPORTED: Answer = { ok: false, error: { code: 'unsupported', message: 'no responder registered' } };

/** A ready host answering each press from `answers` in order, on a manual clock. */
function setup(...answers: Answer[]) {
  let t = 0;
  const queue = [...answers];
  const request = vi.fn(async () => {
    const a = queue.shift() ?? HANDLED;
    if (a === 'reject') throw new Error('transport gone');
    return a as never;
  });
  const exit = vi.fn();
  const press = createBackHandler({ isReady: () => true, request }, exit, 1000, () => t);
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { exit, request, press, flush, at: (ms: number) => void (t = ms) };
}

describe('createBackHandler: answered presses', () => {
  it('handled: consumed, no exit', async () => {
    const s = setup(HANDLED);
    expect(s.press()).toBe(true);
    await s.flush();
    expect(s.exit).not.toHaveBeenCalled();
  });
  it.each([['exit', EXIT], ['unsupported', UNSUPPORTED]] as const)('%s: exits', async (_n, a) => {
    const s = setup(a);
    expect(s.press()).toBe(true);
    await s.flush();
    expect(s.exit).toHaveBeenCalledTimes(1);
  });
});

describe('createBackHandler: escape hatch for an unanswered DOM', () => {
  it.each([['timeout', TIMEOUT], ['failed', FAILED], ['rejection', 'reject']] as const)('a single %s swallows the press', async (_n, a) => {
    const s = setup(a);
    expect(s.press()).toBe(true);
    await s.flush();
    expect(s.exit).not.toHaveBeenCalled();
  });

  it.each([['timeout', TIMEOUT], ['failed', FAILED], ['rejection', 'reject']] as const)('a second press within the window of a %s exits without asking the DOM again', async (_n, a) => {
    const s = setup(a);
    s.at(0);
    s.press();
    await s.flush();
    s.at(BACK_ESCAPE_WINDOW_MS);
    expect(s.press()).toBe(true);
    expect(s.exit).toHaveBeenCalledTimes(1);
    expect(s.request).toHaveBeenCalledTimes(1);
  });

  it('an answered press between them resets it: the next press asks the DOM instead of exiting', async () => {
    let t = 0;
    const resolvers: Array<(a: ResResult<'handled' | 'exit'>) => void> = [];
    const request = vi.fn(() => new Promise<ResResult<'handled' | 'exit'>>((r) => resolvers.push(r)));
    const exit = vi.fn();
    const press = createBackHandler({ isReady: () => true, request: request as never }, exit, 1000, () => t);
    const flush = () => new Promise((r) => setTimeout(r, 0));
    press(); // A at 0
    t = 500;
    press(); // B at 500, sent while A is still pending
    t = 1000;
    resolvers[0]!(TIMEOUT as ResResult<never>); // A goes unanswered
    await flush();
    t = 1200;
    resolvers[1]!(HANDLED as ResResult<'handled'>); // B answered: reset
    await flush();
    t = 1500;
    expect(press()).toBe(true); // C inside A's window, but after an answered press
    expect(exit).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('without that answered press, the same timing exits', async () => {
    let t = 0;
    const resolvers: Array<(a: ResResult<'handled' | 'exit'>) => void> = [];
    const request = vi.fn(() => new Promise<ResResult<'handled' | 'exit'>>((r) => resolvers.push(r)));
    const exit = vi.fn();
    const press = createBackHandler({ isReady: () => true, request: request as never }, exit, 1000, () => t);
    press();
    t = 1000;
    resolvers[0]!(TIMEOUT as ResResult<never>);
    await new Promise((r) => setTimeout(r, 0));
    t = 1500;
    press();
    expect(exit).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('presses far apart never exit', async () => {
    const s = setup(TIMEOUT, TIMEOUT, TIMEOUT);
    for (const ms of [0, BACK_ESCAPE_WINDOW_MS + 1, 2 * BACK_ESCAPE_WINDOW_MS + 2]) {
      s.at(ms);
      expect(s.press()).toBe(true);
      await s.flush();
    }
    expect(s.exit).not.toHaveBeenCalled();
    expect(s.request).toHaveBeenCalledTimes(3);
  });

  it('before ready nothing is consumed and the hatch never fires', () => {
    const exit = vi.fn();
    const press = createBackHandler({ isReady: () => false, request: vi.fn() as never }, exit, 1000, () => 0);
    expect(press()).toBe(false);
    expect(press()).toBe(false);
    expect(exit).not.toHaveBeenCalled();
  });
});
