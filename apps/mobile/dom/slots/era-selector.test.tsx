// @vitest-environment jsdom
import type * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));

const store = vi.hoisted(() => ({
  selectorOpen: false,
  setSelectorOpen: vi.fn(),
  setEra: vi.fn(),
  favorites: [] as string[],
}));
vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppState: () => ({ selectorOpen: store.selectorOpen, eraId: 'debut' }),
  useAppActions: () => ({ setSelectorOpen: store.setSelectorOpen, setEra: store.setEra }),
  useProgress: () => ({
    hydrated: true,
    progress: {
      moments: new Set<string>(),
      eggs: new Set<string>(),
      trails: new Set<string>(),
      favorites: new Set(store.favorites),
    },
  }),
}));
vi.mock('../../../../packages/ui/src/snapshot/context', () => ({
  useReader: () => ({ getContentItem: () => ({ eraId: 'debut' }) }),
}));

import { render, screen } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';
import { createReaderAdapter } from '../reader/reader-modules';
import { buildReaderSlots } from './reader-slots';
import { slots } from './index';

const adapter = createReaderAdapter({ client: { call: vi.fn(), sendDiag: vi.fn() } as never, insets: { top: 0, right: 0, bottom: 0, left: 0 }, navigateDom: vi.fn(), getPath: () => '/' });
const wrap = (el: React.ReactElement) => <HostProvider adapter={adapter}>{el}</HostProvider>;

describe('overlay:era-selector (the TopBar era chooser)', () => {
  it('is registered as an overlay after the app overlays, in the ReaderSlots mapping', () => {
    const app = (() => null) as never;
    const s = buildReaderSlots(slots(), { overlays: [app], fallback: app });
    expect(slots()['overlay:era-selector']).toBeTypeOf('function');
    expect(s.overlays).toContain(slots()['overlay:era-selector']);
    expect(s.overlays[0]).toBe(app);
  });

  it('renders "Choose an era" when selectorOpen (what the TopBar control sets) and nothing while closed', () => {
    const Selector = slots()['overlay:era-selector'] as () => React.ReactElement;
    store.selectorOpen = false;
    const closed = render(wrap(<Selector />));
    expect(screen.queryByText('Choose an era')).toBeNull();
    closed.unmount();
    store.selectorOpen = true;
    render(wrap(<Selector />));
    expect(screen.getByText('Choose an era')).toBeTruthy();
  });

  it('shows the "Your Long Live" card only when the visitor has progress', () => {
    const Selector = slots()['overlay:era-selector'] as () => React.ReactElement;
    store.selectorOpen = true;
    store.favorites = [];
    const empty = render(wrap(<Selector />));
    expect(screen.queryByText('Your Long Live')).toBeNull();
    empty.unmount();
    store.favorites = ['some-item'];
    render(wrap(<Selector />));
    expect(screen.getByText('Your Long Live')).toBeTruthy();
  });
});
