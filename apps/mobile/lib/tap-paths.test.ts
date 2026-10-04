import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyNavigateEvent } from '../dom/bridge/navigate-subscriber';
import { isNativeRoute } from '../dom/slots/routes-instance';
import { registerRoutes, resetRoutesForTests } from '../dom/slots/routes-instance';
import { resetSettingsOverlayForTests, settingsOverlay } from '../dom/slots/settings-store';
import { createTapTarget } from './tap-bind-epoch';
import { isDomOwnedTapPath } from './tap-paths';

afterEach(() => {
  resetSettingsOverlayForTests();
  resetRoutesForTests();
});

describe('isDomOwnedTapPath', () => {
  it('owns the reader route and the settings pages; native routes and other paths stay native', () => {
    registerRoutes({ slice: 'host', nativeRoutes: [{ id: 'host:inbox', match: '/inbox' }] });
    for (const p of ['/', '/?item=x', '/settings', '/settings/notifications', '/settings/notifications?x=1']) {
      expect(isDomOwnedTapPath(p, isNativeRoute)).toBe(true);
    }
    for (const p of ['/inbox', '/privacy', '/vault', '/settings/about']) expect(isDomOwnedTapPath(p, isNativeRoute)).toBe(false);
  });
});

describe('notification tap to settings: real tap target + real DOM subscriber', () => {
  it('emits to the DOM (not openElsewhere), opens the overlay, and counts as delivered only after navigated ok', async () => {
    const emitted: { path: string; id?: string }[] = [];
    const ackCbs: ((a: boolean) => void)[] = [];
    const openElsewhere = vi.fn().mockResolvedValue(true);
    const target = createTapTarget({
      host: {
        isReady: () => true,
        emit: (_t, payload) => (emitted.push({ path: payload.path as string, id: payload.id }), { epoch: 1, seq: emitted.length }),
        onAcked: (_ref, cb) => (ackCbs.push(cb), () => {}),
      },
      isReaderPath: (p) => isDomOwnedTapPath(p, isNativeRoute),
      openElsewhere,
    });
    const ref = target.emit('navigate', { path: '/settings/notifications' as never, source: 'notification' });
    expect(openElsewhere).not.toHaveBeenCalled();
    expect(emitted).toHaveLength(1);

    const delivered = vi.fn();
    target.onAcked(ref!, delivered);
    ackCbs[0](true);
    expect(delivered).not.toHaveBeenCalled();

    const ok = await applyNavigateEvent({ path: emitted[0].path as never }, { replaceUrl: vi.fn(), apply: vi.fn() });
    expect(ok).toBe(true);
    expect(settingsOverlay.isOpen()).toBe(true);
    target.onNavigated({ id: emitted[0].id!, ok });
    expect(delivered).toHaveBeenCalledWith(true);
  });

  it('a non-reader, non-settings path still goes to openElsewhere', () => {
    const openElsewhere = vi.fn().mockResolvedValue(true);
    const emit = vi.fn();
    const target = createTapTarget({
      host: { isReady: () => true, emit, onAcked: () => () => {} },
      isReaderPath: (p) => isDomOwnedTapPath(p, isNativeRoute),
      openElsewhere,
    });
    target.emit('navigate', { path: '/privacy' as never, source: 'notification' });
    expect(openElsewhere).toHaveBeenCalledWith('/privacy');
    expect(emit).not.toHaveBeenCalled();
  });
});
