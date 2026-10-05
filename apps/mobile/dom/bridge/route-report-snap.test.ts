// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setBusy, setSnapshot, type ReaderSnap } from '@swift2/ui';
import { SNAP_THROTTLE_MS, startRouteReporting } from './route-report';

const snap = (scrollY: number): ReaderSnap => ({ v: 1, mode: 'era', eraId: 'lover', scrollY });

describe('route snapshot reporting (#5114)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/');
    setSnapshot(null);
  });
  afterEach(() => {
    setSnapshot(null);
    vi.useRealTimers();
  });

  it('sends a changed snapshot trailing, once per window, with the latest value', () => {
    const send = vi.fn();
    const stop = startRouteReporting(send);
    expect(send).toHaveBeenCalledTimes(1);
    setSnapshot(snap(10));
    setSnapshot(snap(20));
    setSnapshot(snap(30));
    expect(send).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SNAP_THROTTLE_MS);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({ path: '/', snap: snap(30) });
    stop();
  });

  it('never resends an unchanged serialized snapshot, and a cleared snapshot is not sent', () => {
    const send = vi.fn();
    const stop = startRouteReporting(send);
    setSnapshot(snap(10));
    vi.advanceTimersByTime(SNAP_THROTTLE_MS);
    setSnapshot(snap(10));
    setSnapshot(null);
    vi.advanceTimersByTime(SNAP_THROTTLE_MS * 3);
    expect(send).toHaveBeenCalledTimes(2);
    stop();
  });

  it('a busy change goes out immediately with the latest snapshot and cancels the pending send', () => {
    const send = vi.fn();
    const stop = startRouteReporting(send);
    setSnapshot(snap(5));
    setBusy('t', true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({ path: '/', busy: true, snap: snap(5) });
    vi.advanceTimersByTime(SNAP_THROTTLE_MS * 2);
    expect(send).toHaveBeenCalledTimes(2);
    setBusy('t', false);
    stop();
  });

  it('teardown cancels a pending send', () => {
    const send = vi.fn();
    const stop = startRouteReporting(send);
    setSnapshot(snap(1));
    stop();
    vi.advanceTimersByTime(SNAP_THROTTLE_MS * 2);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
