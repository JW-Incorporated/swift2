// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    require('react').createElement('a', { href, ...props }, children),
}));

import { TopBar, ModeToggle } from './TopBar';
import { ShareFallbackToast } from './ShareFallbackToast';
import { EraSection } from './EraSection';
import { scrubberKeyTarget } from '@swift2/ui/reader/shell/TimelineScrubber';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
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
    expect(btn.getAttribute('aria-label')).toBe(`Era: ${era.name} — open the eras menu`);
    expect(btn.textContent).toContain(`Era: ${era.name}`);
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
  it.each(['merch/MerchSection.tsx', 'settings/InboxPage.tsx', 'settings/NotificationSettingsPage.tsx'])(
    '%s renders no <main>',
    (rel) => {
      expect(reader(rel)).not.toMatch(/<\/?main\b/);
    },
  );
  it.each(['settings/InboxPage.tsx', 'settings/NotificationSettingsPage.tsx'])(
    '%s section is labelled by its heading',
    (rel) => {
      expect(reader(rel)).toMatch(/<section\s+aria-labelledby="(ll-[a-z-]+)"/);
    },
  );
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

  it('CountdownBanner renders a persistent status region and its slots carry no role=status', () => {
    const src = reader('era/CountdownBanner.tsx');
    expect(src.match(/role="status"/g)).toHaveLength(1);
    expect(src).toContain('data-ll-banner-live');
  });
});

describe('A11Y-12 timeline scrubber slider', () => {
  it('declares vertical orientation', () => {
    expect(reader('shell/TimelineScrubber.tsx')).toContain('aria-orientation="vertical"');
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
