// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useAppActions } from '@/lib/longlive/store';
import { ReaderRoot, type ReaderSlots } from '@swift2/ui/reader/shell/ReaderShell';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { TestHostProvider } from '@/lib/test-host';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    require('react').createElement('a', { href, ...props }, children),
}));

vi.mock('next/dynamic', () => ({ default: () => () => null }));

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

const stub = (id: string) => () => <div data-testid={id} />;

function ModeButtons() {
  const { setMode } = useAppActions();
  return (
    <>
      {(['era', 'threads', 'mood', 'clownbot', 'community', 'merch'] as const).map((m) => (
        <button key={m} data-testid={`go-${m}`} onClick={() => setMode(m)} />
      ))}
    </>
  );
}

const slots: ReaderSlots = {
  surfaces: { era: stub('s-era'), threads: stub('s-threads'), merch: stub('s-merch') },
  overlays: [stub('o-1'), stub('o-2')],
  footer: stub('footer'),
  floating: stub('floating'),
  fallback: ({ mode }) => <div data-testid="fallback">{mode}</div>,
};

function renderShell(s: ReaderSlots) {
  return renderWithReader(
    <TestHostProvider>
      <ReaderRoot slots={{ ...s, overlays: [...s.overlays, ModeButtons] }} />
    </TestHostProvider>,
  );
}

describe('ReaderShell slots', () => {
  it('renders the era surface, footer, overlays and floating slot by default', () => {
    renderShell(slots);
    expect(screen.getByTestId('s-era')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('o-1')).toBeInTheDocument();
    expect(screen.getByTestId('o-2')).toBeInTheDocument();
    expect(screen.getByTestId('floating')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).toBeNull();
  });

  it('renders the slot for a provided mode and the fallback for a missing one', () => {
    renderShell(slots);
    act(() => screen.getByTestId('go-threads').click());
    expect(screen.getByTestId('s-threads')).toBeInTheDocument();
    act(() => screen.getByTestId('go-mood').click());
    expect(screen.getByTestId('fallback')).toHaveTextContent('mood');
    expect(screen.queryByTestId('s-threads')).toBeNull();
  });

  it('keeps header, main, footer, spacer, overlays, nav order', () => {
    const { container } = renderShell(slots);
    const shell = container.querySelector('.era-shell');
    const tags = Array.from(shell?.children ?? []).map((c) => c.tagName.toLowerCase());
    expect(tags.slice(0, 4)).toEqual(['header', 'main', 'div', 'div']);
    expect(shell?.children[3]?.getAttribute('aria-hidden')).toBe('true');
  });

  it('web LongLive passes every surface slot', async () => {
    const { WEB_READER_SLOTS } = await import('./LongLive');
    expect(Object.keys(WEB_READER_SLOTS.surfaces).sort()).toEqual(
      ['clownbot', 'community', 'era', 'mood', 'merch', 'threads'].sort(),
    );
    expect(WEB_READER_SLOTS.overlays).toHaveLength(7);
    expect(WEB_READER_SLOTS.footer).toBeDefined();
    expect(WEB_READER_SLOTS.floating).toBeDefined();
  });
});
