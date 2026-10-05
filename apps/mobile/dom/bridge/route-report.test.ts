// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { setBusy, setEngaged } from '@swift2/ui';
import { setDomPath } from './dom-path';
import { startRouteReporting } from './route-report';

describe('startRouteReporting', () => {
  it('sends the current route once, then each change, never a repeat, and stops on teardown', () => {
    window.history.replaceState(null, '', '/');
    const send = vi.fn();
    const stop = startRouteReporting(send);
    expect(send).toHaveBeenLastCalledWith({ path: '/' });
    setDomPath('/privacy');
    setDomPath('/privacy');
    expect(send.mock.calls.map((c) => c[0].path)).toEqual(['/', '/privacy']);
    setDomPath('/');
    expect(send).toHaveBeenLastCalledWith({ path: '/' });
    stop();
    setDomPath('/terms');
    expect(send).toHaveBeenCalledTimes(3);
    setDomPath('/');
  });

  it('reports the busy flag with the route when it changes, never a repeat', () => {
    window.history.replaceState(null, '', '/');
    const send = vi.fn();
    const stop = startRouteReporting(send);
    setBusy('t', true);
    setBusy('t', true);
    expect(send).toHaveBeenLastCalledWith({ path: '/', busy: true });
    setBusy('t', false);
    expect(send).toHaveBeenLastCalledWith({ path: '/' });
    expect(send).toHaveBeenCalledTimes(3);
    stop();
    setBusy('t', true);
    expect(send).toHaveBeenCalledTimes(3);
    setBusy('t', false);
  });

  it('reports engaged from the signal and from a legal page, never a repeat', () => {
    window.history.replaceState(null, '', '/');
    const send = vi.fn();
    const stop = startRouteReporting(send);
    setEngaged('t', true);
    setEngaged('u', true);
    expect(send).toHaveBeenLastCalledWith({ path: '/', engaged: true });
    setEngaged('t', false);
    setEngaged('u', false);
    expect(send).toHaveBeenLastCalledWith({ path: '/' });
    setDomPath('/privacy');
    expect(send).toHaveBeenLastCalledWith({ path: '/privacy', engaged: true });
    expect(send).toHaveBeenCalledTimes(4);
    stop();
    setDomPath('/');
  });
});
