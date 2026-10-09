// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    require('react').createElement('a', { href, ...props }, children),
}));

import { OverlayNav } from './OverlayNav';
import { getEra } from '@swift2/experience';
import { createWebAdapter } from '@/lib/host-adapter';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';

const base = createWebAdapter({ push() {}, replace() {} });

describe('OverlayNav share host wiring (WP2.4-A2)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the host share and resolveUrl when provided', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const resolveUrl = (p: string) => `https://www.longlivets.com${p}`;
    renderWithReader(
      <HostProvider adapter={{ ...base, share, resolveUrl }}>
        <AppProvider>
          <OverlayNav era={getEra('lover')} onClose={() => {}} shareTarget={{ kind: 'site' }} />
        </AppProvider>
      </HostProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]?.[0]).toMatchObject({ url: expect.stringContaining('https://www.longlivets.com') });
  });
});

describe('OverlayNav era button accessible name (A11Y-6b, WCAG 2.5.3)', () => {
  it('has no aria-label; both visible variants start with "Era: " and the sr-only suffix follows', () => {
    const era = getEra('lover');
    renderWithReader(
      <HostProvider adapter={base}>
        <AppProvider>
          <OverlayNav era={era} onClose={() => {}} />
        </AppProvider>
      </HostProvider>,
    );
    const btn = screen.getByRole('button', { name: /open the eras menu/i });
    expect(btn).not.toHaveAttribute('aria-label');
    expect(btn.querySelector('span.sm\\:hidden')?.textContent).toBe(`Era: ${era.shortName}`);
    expect(btn.querySelector('span.hidden.sm\\:inline')?.textContent).toBe(`Era: ${era.name}`);
    expect(btn.querySelector('.sr-only')?.textContent).toBe(' — open the eras menu');
  });
});
