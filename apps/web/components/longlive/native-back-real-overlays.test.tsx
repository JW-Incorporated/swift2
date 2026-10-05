// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '@swift2/ui';
import { dismissTopOverlayFromNativeBack } from '@/lib/longlive/useBackDismiss';
import { ClownChat } from './ClownChat';
import { MomentDetail } from './MomentDetail';
import { ShareImageMenu } from './ShareImageMenu';
import { LORE } from '@/lib/longlive/clownbot-lore';
import { CONTENT } from '@/lib/longlive/content';
import { createWebAdapter } from '@/lib/host-adapter';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

// The native Back bridge calls dismissTopOverlayFromNativeBack(); these drive it against REAL components.
const nativeBack = () => {
  let r = false;
  act(() => void (r = dismissTopOverlayFromNativeBack()));
  return r;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function OpenMoment({ id }: { id: string }) {
  const { openItem } = useAppActions();
  useEffect(() => openItem(id), [id]);
  return null;
}

describe('native Back with real overlays', () => {
  it('closes the expanded Clown panel, then has nothing left (exit)', () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <ClownChat lore={LORE} />
        </AppProvider>
      </TestHostProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /expand to full screen/i }));
    expect(screen.getByRole('button', { name: /exit full screen/i })).toBeInTheDocument();
    expect(nativeBack()).toBe(true);
    expect(screen.getByRole('button', { name: /expand to full screen/i })).toBeInTheDocument();
    expect(nativeBack()).toBe(false);
  });

  it('closes only the lightbox first, then the moment', () => {
    const item = CONTENT.find((c) => c.images.length > 1 && !c.images[0].caption && c.tags.length > 0)!;
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <OpenMoment id={item.id} />
          <MomentDetail />
        </AppProvider>
      </TestHostProvider>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /view photo full screen/i })[0]);
    expect(screen.getByRole('dialog', { name: /photo viewer/i })).toBeInTheDocument();
    expect(nativeBack()).toBe(true);
    expect(screen.queryByRole('dialog', { name: /photo viewer/i })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: item.title })).toBeInTheDocument();
    expect(nativeBack()).toBe(true);
    expect(screen.queryByRole('heading', { level: 1, name: item.title })).toBeNull();
    expect(nativeBack()).toBe(false);
  });

  it('closes the open share-image menu', () => {
    const base = createWebAdapter({ push() {}, replace() {} });
    renderWithReader(
      <HostProvider adapter={base}>
        <ShareImageMenu target={{ kind: 'item', itemId: 'interrupted-speech' }} source={{ item: 'interrupted-speech' }} />
      </HostProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /share as image/i }));
    expect(screen.getByRole('button', { name: /Post/ })).toBeInTheDocument();
    expect(nativeBack()).toBe(true);
    expect(screen.queryByRole('button', { name: /Post/ })).toBeNull();
    expect(nativeBack()).toBe(false);
  });

  it('web popstate: one history entry per open, no double-close', async () => {
    await new Promise((r) => setTimeout(r, 100)); // let earlier tests' own history.back() pops land
    for (let i = 0; i < 5; i++) window.dispatchEvent(new PopStateEvent('popstate')); // drain any swallowed-pop counters (stack is empty here)
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <ClownChat lore={LORE} />
        </AppProvider>
      </TestHostProvider>,
    );
    const push = vi.spyOn(window.history, 'pushState');
    fireEvent.click(screen.getByRole('button', { name: /expand to full screen/i }));
    expect(push).toHaveBeenCalledTimes(1);
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    expect(screen.getByRole('button', { name: /expand to full screen/i })).toBeInTheDocument();
    expect(push).toHaveBeenCalledTimes(1);
  });
});
