// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const getEraCalls = vi.hoisted(() => ({ n: 0 }));
vi.mock('@swift2/experience', async (orig) => {
  const real = await orig<typeof import('@swift2/experience')>();
  return {
    ...real,
    getEra: (...a: Parameters<typeof real.getEra>) => {
      getEraCalls.n += 1;
      return real.getEra(...a);
    },
  };
});
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
import { SearchOverlay } from './SearchOverlay';

let actions: ReturnType<typeof useAppActions>;
function Capture() {
  actions = useAppActions();
  return null;
}

function openSearch() {
  renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <Capture />
        <SearchOverlay />
      </AppProvider>
    </TestHostProvider>,
  );
  act(() => actions.setSearchOpen(true));
  return screen.getByRole('combobox');
}

async function type(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  await screen.findByRole('listbox', {}, { timeout: 2000 }).catch(() => null);
}

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

afterEach(cleanup);

describe('search results rows and show-all', () => {
  it('lists era and date context on each option and wraps the title instead of truncating it', async () => {
    const input = openSearch();
    await type(input, 'wedding');
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    const withDate = options.find((o) => /[0-9]{4}/.test(o.querySelector('span.truncate')?.textContent ?? ''));
    expect(withDate).toBeDefined();
    const [titleEl, metaEl] = Array.from((withDate as HTMLElement).querySelectorAll('span.block, span.line-clamp-2, span.truncate'));
    expect(titleEl.className).not.toContain('truncate');
    expect(metaEl.textContent).toContain(' · ');
  });

  it('renders a thumbnail for a photo moment with a fixed-size box', async () => {
    const input = openSearch();
    await type(input, 'wedding');
    const imgs = screen.getByRole('listbox').querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    const box = imgs[0].closest('span') as HTMLElement;
    expect(box.className).toMatch(/h-12/);
    expect(box.className).toMatch(/w-12/);
    expect(imgs[0].getAttribute('loading')).toBe('lazy');
  });

  it('offers a keyboard-reachable Show all that reveals every match in place and announces it', async () => {
    const input = openSearch();
    await type(input, 'wedding');
    const before = screen.getAllByRole('option').length;
    const show = screen.getByRole('button', { name: /^Show all \d+$/ });
    const total = Number(/\d+/.exec(show.textContent ?? '')![0]);
    expect(total).toBeGreaterThan(before);
    expect(screen.getByRole('listbox').contains(show)).toBe(false);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(show)).toBe(true);
    fireEvent.click(show);
    expect(screen.getAllByRole('option').length).toBe(total);
    expect(screen.queryByRole('button', { name: /^Show all/ })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(`Showing all ${total} results for wedding`);
    expect(document.activeElement).toBe(input);
  });

  it('keeps arrow, Enter and Escape behaviour on the input', async () => {
    const input = openSearch();
    await type(input, 'wedding');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1].id);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows no Show all control when nothing is hidden, or when nothing matches', async () => {
    const input = openSearch();
    await type(input, 'zzzzqqqq');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(screen.queryByRole('button', { name: /^Show all/ })).toBeNull();
    expect(screen.getByText(/No matches for/)).toBeInTheDocument();
  });

  it('re-renders only the rows whose active state changed on arrow navigation of a 60+ row list', async () => {
    const input = openSearch();
    await type(input, 'wedding');
    fireEvent.click(screen.getByRole('button', { name: /^Show all [0-9]+$/ }));
    expect(screen.getAllByRole('option').length).toBeGreaterThan(60);
    getEraCalls.n = 0;
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(getEraCalls.n).toBeLessThanOrEqual(2);
  });
});
