// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';

import { ShareImageMenu } from './ShareImageMenu';
import { clearPrefetchedShareCards } from '@/lib/longlive/share-payload';
import { createWebAdapter } from '@/lib/host-adapter';
import { renderWithReader } from '@/lib/longlive/render-with-reader';

const base = createWebAdapter({ push() {}, replace() {} });
const target = { kind: 'item', itemId: 'interrupted-speech' } as const;
const source = { item: 'interrupted-speech' };

function renderMenu(adapter: typeof base) {
  return renderWithReader(
    <HostProvider adapter={adapter}>
      <ShareImageMenu target={target} source={source} />
    </HostProvider>,
  );
}

describe('ShareImageMenu host wiring (WP2.4-A2)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    clearPrefetchedShareCards();
    fetchMock.mockReset().mockImplementation(async () => new Response(new Uint8Array([1]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('routes the card prefetch and the shared URL through the host resolveUrl', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    renderMenu({ ...base, share, resolveUrl });
    fireEvent.click(screen.getByRole('button', { name: /share as image/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    for (const call of fetchMock.mock.calls) expect(String(call[0])).toMatch(/^https:\/\/www\.longlivets\.com\//);
    fireEvent.click(screen.getByRole('button', { name: /Post/ }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]?.[0]).toMatchObject({ url: expect.stringContaining('https://www.longlivets.com') });
  });

  it('web host (no resolveUrl) keeps relative card fetches', async () => {
    renderMenu(base);
    fireEvent.click(screen.getByRole('button', { name: /share as image/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    for (const call of fetchMock.mock.calls) expect(String(call[0])).toMatch(/^\//);
  });
});
