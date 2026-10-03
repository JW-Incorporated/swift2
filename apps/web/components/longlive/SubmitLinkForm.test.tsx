// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '@swift2/ui';
import { SubmitLinkForm } from '@swift2/ui/reader/merch/SubmitLinkForm';
import { createWebAdapter } from '@/lib/host-adapter';

vi.mock('next/link', () => ({ default: () => null }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('lucide-react', () => ({ Check: () => null, Loader2: () => null }));

function mount() {
  const adapter = createWebAdapter({ push() {}, replace() {} });
  return render(
    <HostProvider adapter={adapter}>
      <SubmitLinkForm section="merch" />
    </HostProvider>,
  );
}

async function submit() {
  fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'https://example.com/x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.head.querySelectorAll('script').forEach((el) => el.remove());
});

describe('SubmitLinkForm on the web root adapter', () => {
  it('posts the exact request the form sent before, without a site key (no widget)', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = mount();
    expect(container.querySelector('script')).toBeNull();
    expect(document.head.querySelector('script[src*="turnstile"]')).toBeNull();
    await submit();
    await waitFor(() => expect(screen.getByText(/sent for review/)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith('/api/submit-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/x', section: 'merch', hp: '', token: '' }),
    });
  });

  it('loads the Turnstile script when the web adapter carries a site key', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key');
    mount();
    expect(document.head.querySelector('script[src*="turnstile"]')).not.toBeNull();
  });

  it('shows the server error text on a non-2xx response', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"Slow down."}', { status: 429 })));
    mount();
    await submit();
    await waitFor(() => expect(screen.getByText('Slow down.')).toBeTruthy());
  });
});
