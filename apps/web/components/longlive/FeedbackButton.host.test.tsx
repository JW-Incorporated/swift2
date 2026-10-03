// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    require('react').createElement('a', { href, ...props }, children),
}));

import { HostProvider, type HostAdapter } from '@swift2/ui';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { createWebAdapter, createWebRootAdapter } from '@/lib/host-adapter';
import { TestHostProvider } from '@/lib/test-host';

const router = { push() {}, replace() {} };

function mount(adapter: HostAdapter) {
  return renderWithReader(
    <HostProvider adapter={adapter}>
      <AppProvider>
        <FeedbackButton />
      </AppProvider>
    </HostProvider>,
  );
}

async function sendMessage() {
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  fireEvent.change(screen.getByLabelText('Describe the issue'), { target: { value: 'typo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

describe('FeedbackButton host capabilities (WP2.13 A2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    cleanup();
  });

  it('web root adapter reports location.href; the base adapter omits it', () => {
    expect(createWebRootAdapter(router).currentUrl?.()).toBe(window.location.href);
    expect(createWebAdapter(router).currentUrl).toBeUndefined();
  });

  it('POSTs /api/feedback with the same method, headers and body shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    mount(createWebRootAdapter(router));
    await sendMessage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/feedback');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    const body = JSON.parse(init.body);
    expect(body.message).toBe('typo');
    expect(body.hp).toBe('');
    expect(body.location.url).toBe(window.location.href);
    await waitFor(() => expect(screen.getByText(/your report was filed/)).toBeTruthy());
  });

  it('shows the server error message and the network-error fallback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Too many reports' }), { status: 429 }))
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    mount(createWebRootAdapter(router));
    await sendMessage();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Too many reports'));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Network error — please try again.'),
    );
  });

  it('persists dismissal under the same sessionStorage key and hydrates from it', () => {
    const first = mount(createWebRootAdapter(router));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss the feedback button for this session' }));
    expect(window.sessionStorage.getItem('ll-feedback-dismissed-v1')).toBe('1');
    first.unmount();
    mount(createWebRootAdapter(router));
    expect(screen.queryByRole('button', { name: 'Send feedback' })).toBeNull();
  });

  it('renders under TestHostProvider with currentUrl absent (url omitted)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <FeedbackButton />
        </AppProvider>
      </TestHostProvider>,
    );
    await sendMessage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).location.url).toBeUndefined();
  });
});
