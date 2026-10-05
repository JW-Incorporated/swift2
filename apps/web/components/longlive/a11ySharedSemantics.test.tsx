// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { HostProvider } from '@swift2/ui';
import { createWebAdapter } from '@/lib/host-adapter';
import { act, render, screen, within } from '@testing-library/react';

const live = vi.hoisted(() => ({ theories: [] as unknown[] }));
vi.mock('@swift2/ui/reader/lib/use-live-theories', () => ({
  useLiveTheories: () => ({ theories: live.theories, signals: [] }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    require('react').createElement('a', { href, ...props }, children),
}));

import { TopBar, ModeToggle } from './TopBar';
import { ShareFallbackToast } from './ShareFallbackToast';
import { EraSection } from './EraSection';
import { CountdownBanner } from './CountdownBanner';
import { TimelineScrubber } from './TimelineScrubber';
import { InboxPage } from '@swift2/ui/reader/settings/InboxPage';
import { NotificationSettingsPage } from '@swift2/ui/reader/settings/NotificationSettingsPage';
import { MerchSection } from '@swift2/ui/reader/merch/MerchSection';
import { scrubberKeyTarget } from '@swift2/ui/reader/shell/TimelineScrubber';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
import { MERCH_EXTENSIONS } from '@/lib/longlive/merch-extensions';
import { CURRENT_ERA_ID, getEra } from '@swift2/experience';

const reader = (rel: string) =>
  readFileSync(join(__dirname, '../../../../packages/ui/src/reader', rel), 'utf8');

describe('A11Y-5 ModeToggle is a button group, not a tablist', () => {
  it('exposes aria-pressed buttons and no tab roles', () => {
    render(<ModeToggle mode="threads" onChange={() => undefined} />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryByRole('tablist')).toBeNull();
    const group = screen.getByRole('group', { name: 'Navigation mode' });
    expect(within(group).getAllByRole('button')).toHaveLength(6);
    expect(within(group).getByRole('button', { name: 'Threads' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Eras' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('A11Y-6 era button accessible name contains its visible label', () => {
  it('starts with "Era: <name>"', () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <TopBar />
        </AppProvider>
      </TestHostProvider>,
    );
    const era = getEra(CURRENT_ERA_ID);
    const btn = screen.getByRole('button', { name: /open the eras menu/i });
    expect(btn).not.toHaveAttribute('aria-label');
    // Both responsive spans (mobile shortName, desktop name) are in the name
    // source, each starting with the visible "Era: " text, then the suffix.
    const mobile = btn.querySelector('span.sm\\:hidden')!;
    const desktop = btn.querySelector('span.hidden.sm\\:inline')!;
    expect(mobile.textContent).toBe(`Era: ${era.shortName}`);
    expect(desktop.textContent).toBe(`Era: ${era.name}`);
    expect(btn.querySelector('.sr-only')?.textContent).toBe(' — open the eras menu');
  });
});

describe('A11Y-7 era heading is an h2 labelling its section', () => {
  it('has no h1 and aria-labelledby points at the era h2', () => {
    const era = getEra(CURRENT_ERA_ID);
    const { container } = renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <EraSection era={era} />
        </AppProvider>
      </TestHostProvider>,
    );
    expect(container.querySelectorAll('h1')).toHaveLength(0);
    const section = container.querySelector('section[data-ll-section]')!;
    const labelId = section.getAttribute('aria-labelledby')!;
    const heading = container.querySelector(`[id="${labelId}"]`)!;
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe(era.name);
  });
  it('the masthead keeps the single h1', () => {
    expect(reader('era/LandingMasthead.tsx')).toMatch(/<h1\b/);
  });
});

describe('A11Y-8 no nested main landmarks', () => {
  it('the notification settings page renders a section labelled by its h1, no main', () => {
    const { container } = render(
      <TestHostProvider>
        <NotificationSettingsPage vapidPublicKey={null} />
      </TestHostProvider>,
    );
    expect(container.querySelector('main')).toBeNull();
    expect(screen.getByRole('region', { name: 'Notification settings' })).toBeInTheDocument();
  });

  it('the notification settings route supplies the one main around it', () => {
    const src = readFileSync(
      join(__dirname, '../../app/settings/notifications/page.tsx'),
      'utf8',
    );
    expect(src).toMatch(/<main>\s*<NotificationSettingsPage/);
  });

  it('the inbox page renders a labelled section, no main', () => {
    const apiFetch = vi.fn().mockResolvedValue({ status: 200, headers: {}, body: JSON.stringify({ events: [] }) });
    const adapter = { ...createWebAdapter({ push() {}, replace() {} }), apiFetch };
    const { container } = render(
      <HostProvider adapter={adapter}>
        <InboxPage onClose={() => undefined} onOpenItem={() => undefined} />
      </HostProvider>,
    );
    expect(container.querySelector('main')).toBeNull();
    expect(screen.getByRole('region', { name: 'Inbox' })).toBeInTheDocument();
  });

  it('the merch section renders no main', () => {
    const { container } = renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <MerchSection extensions={MERCH_EXTENSIONS} />
        </AppProvider>
      </TestHostProvider>,
    );
    expect(container.querySelector('main')).toBeNull();
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe('A11Y-11 live regions are mounted before content', () => {
  it('ShareFallbackToast keeps one status region across the payload arriving', () => {
    render(
      <TestHostProvider>
        <ShareFallbackToast />
      </TestHostProvider>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('');
    expect(region).toHaveAttribute('aria-live', 'polite');
    act(() => {
      window.dispatchEvent(
        new CustomEvent('longlive-share-fallback', {
          detail: { text: 't', url: 'https://x.test', title: 'T', copied: true },
        }),
      );
    });
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Link copied');
    expect(screen.getByRole('complementary')).not.toHaveAttribute('aria-live');
  });

  it('CountdownBanner keeps one status node while its announcement text arrives', () => {
    live.theories = [];
    const { container, rerender } = render(
      <TestHostProvider>
        <CountdownBanner currentItems={[]} />
      </TestHostProvider>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('');
    expect(container.querySelector('[data-ll-theory-banner]')).toBeNull();
    live.theories = [
      { id: 't1', name: 'The Big One', status: 'rumor', heat: 9, claim: '', origin: 'fan' },
    ];
    rerender(
      <TestHostProvider>
        <CountdownBanner currentItems={[]} />
      </TestHostProvider>,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Fans are onto something: The Big One');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(container.querySelector('[data-ll-theory-banner]')).toHaveAttribute('aria-hidden', 'true');
    live.theories = [];
  });
});

describe('A11Y-12 timeline scrubber slider', () => {
  it('the rendered slider declares vertical orientation', () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <TimelineScrubber />
        </AppProvider>
      </TestHostProvider>,
    );
    expect(screen.getByRole('slider', { name: /timeline scrubber$/i })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
  it('maps Home/End/PageUp/PageDown/Arrow keys and ignores others', () => {
    const start = 0;
    const end = 2400;
    expect(scrubberKeyTarget('Home', 1000, start, end)).toBe(end);
    expect(scrubberKeyTarget('End', 1000, start, end)).toBe(start);
    expect(scrubberKeyTarget('ArrowUp', 1000, start, end)).toBe(1100);
    expect(scrubberKeyTarget('ArrowDown', 1000, start, end)).toBe(900);
    expect(scrubberKeyTarget('PageUp', 1000, start, end)).toBe(1400);
    expect(scrubberKeyTarget('PageDown', 1000, start, end)).toBe(600);
    expect(scrubberKeyTarget('PageUp', 2300, start, end)).toBe(end);
    expect(scrubberKeyTarget('PageDown', 100, start, end)).toBe(start);
    expect(scrubberKeyTarget('a', 1000, start, end)).toBeNull();
  });
});
