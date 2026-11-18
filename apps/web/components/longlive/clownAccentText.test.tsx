// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClownEmptyState } from '@swift2/ui/reader/clown/ClownEmptyState';
import { ClownItemCard } from '@swift2/ui/reader/clown/ClownItemCard';
import { ClownBoard } from '@swift2/ui/reader/clown/ClownBoard';
import { FAN_THEORY_CHIP_LABEL } from '@swift2/ui/reader/clown/lib/clown-starters';
import type { BoardItem } from '@swift2/ui/reader/clown/lib/clown-board';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { TestHostProvider } from '@/lib/test-host';

const ACCENT_TEXT = 'text-[color:var(--era-accent-text)]';
const RAW_ACCENT_TEXT = 'text-[color:var(--era-accent)]';

const liveItem: BoardItem = {
  id: 'live-1',
  title: 'A live rumor',
  blurb: 'b',
  prompt: 'p',
  date: '2026-11-01',
} as unknown as BoardItem;

describe('Clownbot accent-coloured text uses --era-accent-text (WCAG 1.4.3)', () => {
  it('fan-theory chip text uses the accent-text token, border stays on the accent', () => {
    render(<ClownEmptyState intro="hi" onSelect={vi.fn()} onFanTheoryChip={vi.fn()} />);
    const chip = screen.getByRole('button', { name: FAN_THEORY_CHIP_LABEL });
    expect(chip).toHaveClass(ACCENT_TEXT);
    expect(chip).not.toHaveClass(RAW_ACCENT_TEXT);
    expect(chip).toHaveClass('border-[color:var(--era-accent)]');
  });

  it('"Ask clown bot" link text uses the accent-text token', () => {
    render(
      <ul>
        <ClownItemCard variant="live" item={liveItem} onSelect={vi.fn()} now={new Date('2026-11-10')} pulse={false} />
      </ul>,
    );
    const link = screen.getByText(/Ask clown bot/);
    expect(link).toHaveClass(ACCENT_TEXT);
    expect(link).not.toHaveClass(RAW_ACCENT_TEXT);
  });

  it('"N open" badge text uses the accent-text token, tint stays on the accent', () => {
    renderWithReader(
      <TestHostProvider>
        <ClownBoard onSelect={vi.fn()} lore={[]} />
      </TestHostProvider>,
    );
    const badge = screen.getByText(/\d+ open/);
    expect(badge).toHaveClass(ACCENT_TEXT);
    expect(badge).not.toHaveClass(RAW_ACCENT_TEXT);
    expect(badge).toHaveClass('bg-[color:var(--era-accent)]/15');
  });
});
