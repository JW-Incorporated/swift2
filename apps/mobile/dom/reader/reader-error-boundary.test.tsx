// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { MAX_AUTO_RETRIES, RAPID_WINDOW_MS, ReaderErrorBoundary, nextBoundaryStep } from './reader-error-boundary';

// React may re-run a throwing render internally, so "broken" is a switch, not a countdown.
const ctl = { broken: false };
function Reader() {
  if (ctl.broken) throw new Error('boom');
  return <main data-reader="">reader</main>;
}

let clock = 0;
const mount = (onError = vi.fn()) => {
  render(
    <ReaderErrorBoundary onError={onError} now={() => clock}>
      <Reader />
    </ReaderErrorBoundary>,
  );
  return onError;
};

beforeEach(() => {
  ctl.broken = false;
  clock = 1_000;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('nextBoundaryStep (loop guard)', () => {
  it('retries up to MAX_AUTO_RETRIES rapid throws, then falls back', () => {
    let recent: number[] = [];
    const steps: string[] = [];
    for (let i = 0; i <= MAX_AUTO_RETRIES; i++) {
      const r = nextBoundaryStep(recent, 100 + i);
      recent = r.recent;
      steps.push(r.step);
    }
    expect(steps).toEqual([...Array(MAX_AUTO_RETRIES).fill('retry'), 'fallback']);
  });

  it('throws further apart than the window do not accumulate', () => {
    const r = nextBoundaryStep([0, 1], RAPID_WINDOW_MS + 1);
    expect(r).toEqual({ step: 'retry', recent: [RAPID_WINDOW_MS + 1] });
  });
});

describe('ReaderErrorBoundary', () => {
  it('renders the reader untouched when nothing throws', () => {
    const onError = mount();
    expect(screen.getByText('reader')).toBeTruthy();
    expect(onError).not.toHaveBeenCalled();
  });

  it('a one-off render throw is reported and the reader remounts by itself', () => {
    ctl.broken = true;
    const onError = mount(vi.fn(() => void (ctl.broken = false)));
    expect(screen.getByText('reader')).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('reader-render: boom');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a reader that keeps throwing stops auto-retrying and shows an accessible fallback; Reload remounts it', () => {
    ctl.broken = true;
    const onError = mount();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Something went wrong');
    expect(onError).toHaveBeenCalledTimes(MAX_AUTO_RETRIES + 1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reload' }));
    act(() => void (clock += RAPID_WINDOW_MS * 2));
    expect(onError).toHaveBeenCalledTimes(MAX_AUTO_RETRIES + 1);
    ctl.broken = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(screen.getByText('reader')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('the fallback moves focus to Reload for keyboard and screen-reader users', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    ctl.broken = true;
    mount();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reload' }));
    before.remove();
  });

  it('Reload resets the guard, so a reader still broken comes back to the fallback, never a loop', () => {
    ctl.broken = true;
    const onError = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(2 * (MAX_AUTO_RETRIES + 1));
  });
});
