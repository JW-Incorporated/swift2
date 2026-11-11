// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { GLOSS_SECTIONS } from '@swift2/experience';
import { LandingMasthead } from '@swift2/ui/reader/era/LandingMasthead';
import { EraSelector } from '@swift2/ui/reader/shell/EraSelector';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppState } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

const pick = vi.hoisted(() => ({ mode: 'era' as string }));
vi.mock('@swift2/experience', async (importOriginal) => {
  const real = await importOriginal<typeof import('@swift2/experience')>();
  return {
    ...real,
    dailyGloss: () => real.GLOSS_SECTIONS.find((g) => g.mode === pick.mode),
  };
});

function SelectorProbe() {
  return <output data-testid="selector">{String(useAppState().selectorOpen)}</output>;
}

function mount(onNavigate = vi.fn()) {
  renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <LandingMasthead onNavigate={onNavigate} />
        <SelectorProbe />
        <EraSelector />
      </AppProvider>
    </TestHostProvider>,
  );
  return onNavigate;
}

describe('LandingMasthead gloss pill', () => {
  afterEach(cleanup);

  it('the Eras gloss opens the era picker instead of doing nothing', () => {
    pick.mode = 'era';
    const onNavigate = mount();
    expect(screen.getByTestId('selector').textContent).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(GLOSS_SECTIONS[0]!.label) }));
    expect(screen.getByTestId('selector').textContent).toBe('true');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('closing the picker returns focus to the gloss pill that opened it', () => {
    pick.mode = 'era';
    mount();
    const pill = screen.getByRole('button', { name: new RegExp(GLOSS_SECTIONS[0]!.label) });
    pill.focus();
    fireEvent.click(pill);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close era selector' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(pill);
  });

  it('other glosses still navigate to their section', () => {
    pick.mode = 'threads';
    const onNavigate = mount();
    fireEvent.click(screen.getByRole('button', { name: /Threads/ }));
    expect(onNavigate).toHaveBeenCalledWith('threads');
    expect(screen.getByTestId('selector').textContent).toBe('false');
  });
});
