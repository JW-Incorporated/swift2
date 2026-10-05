// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';

// apps/mobile resolves its own react copy; the package hooks use apps/web's, so pin both to it.
// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { render } from '@testing-library/react';
import { ReaderExtensionsProvider, ReaderSnapshotProvider } from '@swift2/ui';
import { register, resetSlotsForTests, slots } from './instance';
import { APP_ORIGIN, createAppAdapter } from '../bridge/app-adapter';
import { ClownSurface } from './clown';

const seen = vi.hoisted(() => ({ lore: undefined as unknown }));
vi.mock('./lazy-loaders', () => ({
  loadClownChat: () => ({ lore }: { lore?: unknown }) => {
    seen.lore = lore;
    return null;
  },
  loadMoodChat: () => () => null,
  loadThreadsMode: () => () => null,
  loadCommunitySection: () => () => null,
}));

afterEach(() => resetSlotsForTests());

describe('clown slice', () => {
  it('registers the clownbot and mood surfaces', () => {
    const s = slots();
    expect(s['surface:clownbot']).toBe(ClownSurface);
    expect(s['surface:mood']).toBeTypeOf('function');
    expect(() => register({ slice: 'other', slots: { 'surface:mood': () => null } })).toThrow(/duplicate slot/);
  });

  it('feeds ClownChat the lore from the extensions provider', () => {
    const lore = [{ id: 'l1' }];
    const core = { domains: {} } as never;
    const extensions = { merch: [], songMoods: {}, lore } as never;
    render(
      createElement(ReaderSnapshotProvider, {
        value: core,
        children: createElement(ReaderExtensionsProvider, { extensions, children: createElement(ClownSurface) }),
      }),
    );
    expect(seen.lore).toEqual(lore);
  });

  it('live board URLs resolve to the canonical origin (global fetch, public GET with ACAO *)', () => {
    const a = createAppAdapter({ client: { call: vi.fn() } as never, apiFetch: vi.fn(), isNativeRoute: () => false, navigateDom: vi.fn(), getPath: () => '/', insets: { top: 0, right: 0, bottom: 0, left: 0 }, storage: { local: { get: () => null, set: () => {}, remove: () => {} }, session: { get: () => null, set: () => {}, remove: () => {} } } as never, onBack: () => () => {} });
    expect(a.resolveUrl?.('/vault/live/fearless')).toBe(`${APP_ORIGIN}/vault/live/fearless`);
  });

  it('claims no native routes (clownbot and mood render in the DOM)', async () => {
    const { isNativeRoute } = await import('./routes');
    for (const p of ['/?mode=clownbot', '/?mode=mood', '/clownbot/transcript']) expect(isNativeRoute(p)).toBe(false);
  });
});
