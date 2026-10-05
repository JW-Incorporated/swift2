import { describe, expect, it, vi } from 'vitest';
import { BACKOFF_BASE_MS, MIN_INTERVAL_MS, createForegroundRefresh } from './foreground-refresh';

function setup(results: Array<'ok' | 'fail'>) {
  let t = 1_000_000;
  const load = vi.fn(async () => {
    const r = results.shift() ?? 'ok';
    if (r === 'fail') throw new Error('offline');
    return 'bundle';
  });
  const onLoaded = vi.fn();
  const onError = vi.fn();
  const fr = createForegroundRefresh({ load, now: () => t, onLoaded, onError });
  const advance = (ms: number) => void (t += ms);
  const flush = () => new Promise((r) => setTimeout(r, 0));
  return { fr, load, onLoaded, advance, flush, onError };
}

describe('foreground refresh', () => {
  it('launch offline -> foreground online -> exactly one refresh', async () => {
    const s = setup(['fail', 'ok']);
    await s.fr.launch().catch(() => undefined);
    s.load.mockClear();
    s.advance(BACKOFF_BASE_MS);
    s.fr.foreground();
    s.fr.foreground();
    await s.flush();
    expect(s.load).toHaveBeenCalledTimes(1);
    expect(s.onLoaded).toHaveBeenCalledWith('bundle');
  });

  it('does nothing before the launch refresh has reported', () => {
    const s = setup([]);
    s.fr.foreground();
    expect(s.load).not.toHaveBeenCalled();
  });

  it('rapid foregrounds after a success are debounced to the 5 minute floor', async () => {
    const s = setup([]);
    await s.fr.launch();
    s.load.mockClear();
    s.advance(MIN_INTERVAL_MS - 1);
    s.fr.foreground();
    expect(s.load).not.toHaveBeenCalled();
    s.advance(1);
    s.fr.foreground();
    await s.flush();
    expect(s.load).toHaveBeenCalledTimes(1);
  });

  it('failures back off exponentially', async () => {
    const s = setup(['fail', 'fail', 'fail']);
    await s.fr.launch().catch(() => undefined);
    s.load.mockClear();
    s.advance(BACKOFF_BASE_MS);
    s.fr.foreground();
    await s.flush();
    expect(s.load).toHaveBeenCalledTimes(1);
    expect(s.onError).toHaveBeenCalledTimes(1);
    s.advance(BACKOFF_BASE_MS * 2 - 1);
    s.fr.foreground();
    expect(s.load).toHaveBeenCalledTimes(1);
    s.advance(1);
    s.fr.foreground();
    await s.flush();
    expect(s.load).toHaveBeenCalledTimes(2);
  });

  it('ignores foregrounds after dispose', async () => {
    const s = setup([]);
    await s.fr.launch();
    s.load.mockClear();
    s.fr.dispose();
    s.advance(MIN_INTERVAL_MS);
    s.fr.foreground();
    expect(s.load).not.toHaveBeenCalled();
  });
});
