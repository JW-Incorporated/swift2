// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';
import type { HostAdapter } from '@swift2/ui';
import { webApiFetch } from '@swift2/content';
import type { CurrentItem } from '@swift2/shared';
import { CurrentItemDetail } from '@swift2/ui/reader/era/CurrentItemDetail';
import { TestHostProvider } from '@/lib/test-host';

vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppActions: () => ({ goHome: () => {} }),
}));

const item = {
  id: 'ci-1',
  eraId: 'tortured-poets',
  observedOn: '2026-10-01',
  headline: 'A headline',
  summary: 'A summary',
  detail: 'A detail',
  status: 'rumor',
  sources: [{ name: 'Pub', url: 'https://pub.example/a', tier: 'tier1' }],
} as unknown as CurrentItem;

const era = {
  theme: { bg: '#000', surface: '#111', surface2: '#222', ink: '#fff', inkSoft: '#ccc', accent: '#ebc97f', accent2: '#b49bee', glow: '#000', font: 'sans' },
} as never;
const EXPECTED_BODY = JSON.stringify({
  headline: item.headline,
  summary: item.summary,
  itemId: item.id,
  eraId: item.eraId,
  status: item.status,
  sources: item.sources,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function click() {
  fireEvent.click(screen.getByRole('button', { name: /Help us verify this/ }));
}

describe('CurrentItemDetail intake goes through the host apiFetch', () => {
  it('hits the resolved canonical URL under a non-identity-resolver host', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const resolveUrl = (p: string) => `https://api.example.test${p}`;
    const adapter = {
      resolveUrl,
      apiFetch: (req) =>
        webApiFetch({ ...req, path: resolveUrl(req.path) as `/api/${string}` }),
    } as HostAdapter;
    render(createElement(HostProvider, { adapter }, createElement(CurrentItemDetail, { item, era, onClose: () => {} })));
    click();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.test/api/intake');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(EXPECTED_BODY);
    await screen.findByText('Thanks — flagged for review');
  });

  it('web host keeps the relative URL with identical method, headers and body', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(TestHostProvider, null, createElement(CurrentItemDetail, { item, era, onClose: () => {} })));
    click();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: EXPECTED_BODY,
    });
  });

  it('a non-2xx response shows the retry state', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    render(createElement(TestHostProvider, null, createElement(CurrentItemDetail, { item, era, onClose: () => {} })));
    click();
    await screen.findByText(/Couldn’t send/);
  });
});
