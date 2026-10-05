// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { setDomPath } from './dom-path';
import { startRouteReporting } from './route-report';

describe('startRouteReporting', () => {
  it('sends the current route once, then each change, never a repeat, and stops on teardown', () => {
    window.history.replaceState(null, '', '/');
    const send = vi.fn();
    const stop = startRouteReporting(send);
    expect(send).toHaveBeenLastCalledWith('/');
    setDomPath('/privacy');
    setDomPath('/privacy');
    expect(send.mock.calls.map((c) => c[0])).toEqual(['/', '/privacy']);
    setDomPath('/');
    expect(send).toHaveBeenLastCalledWith('/');
    stop();
    setDomPath('/terms');
    expect(send).toHaveBeenCalledTimes(3);
    setDomPath('/');
  });
});
