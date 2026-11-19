// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, type ReactNode } from 'react';
import { isLoadFailure, lazyWithRetry } from './lazy-with-retry';

function Merch({ label = 'Merch loaded' }: { label?: string }) {
  return <p>{label}</p>;
}

const setOnline = (online: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online });

describe('lazyWithRetry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setOnline(true);
  });

  it('renders the component once its chunk loads', async () => {
    const Lazy = lazyWithRetry(async () => Merch);
    render(<Lazy label="hello" />);
    expect(await screen.findByText('hello')).toBeInTheDocument();
  });

  it('shows an inline offline message instead of throwing, and keeps siblings mounted', async () => {
    setOnline(false);
    const load = vi.fn().mockRejectedValue(new Error('ChunkLoadError'));
    const Lazy = lazyWithRetry(load);
    render(
      <div>
        <nav>Other tabs</nav>
        <Lazy />
      </div>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('You’re offline');
    expect(screen.getByText('Other tabs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('retry re-attempts the import and renders the component when it succeeds', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('ChunkLoadError')).mockResolvedValue(Merch);
    const Lazy = lazyWithRetry(load);
    render(<Lazy />);
    expect(await screen.findByRole('alert')).toHaveTextContent('This didn’t load');
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(await screen.findByText('Merch loaded')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('stays on the message when a retry fails again, and can be retried once more', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('ChunkLoadError'))
      .mockRejectedValueOnce(new Error('ChunkLoadError'))
      .mockResolvedValue(Merch);
    const Lazy = lazyWithRetry(load);
    render(<Lazy />);
    await screen.findByRole('alert');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(await screen.findByText('Merch loaded')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('rethrows a render error from the loaded component instead of calling it a download problem', async () => {
    function Broken(): never {
      throw new Error('merch render bug');
    }
    class Outer extends Component<{ children: ReactNode }, { message: string | null }> {
      state = { message: null as string | null };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      render() {
        return this.state.message ? <p>page error: {this.state.message}</p> : this.props.children;
      }
    }
    const Lazy = lazyWithRetry(async () => Broken);
    render(
      <Outer>
        <Lazy />
      </Outer>,
    );
    expect(await screen.findByText('page error: merch render bug')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it.each([
    Object.assign(new Error('Loading chunk 42 failed.'), { name: 'ChunkLoadError' }),
    new TypeError('Failed to fetch dynamically imported module: https://x.test/_next/static/chunks/a.js'),
    new Error('Failed to load chunk /_next/static/chunks/a.js'),
    new TypeError('error loading dynamically imported module'),
  ])('isLoadFailure recognises %s', (error) => {
    expect(isLoadFailure(error)).toBe(true);
  });

  it.each([new Error('merch render bug'), new TypeError("Cannot read properties of undefined (reading '0')"), 'nope', null])(
    'isLoadFailure rejects %s',
    (error) => {
      expect(isLoadFailure(error)).toBe(false);
    },
  );

  it('re-attempts the import when the surface is left and re-entered after a failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('ChunkLoadError')).mockResolvedValue(Merch);
    const Lazy = lazyWithRetry(load);
    const first = render(<Lazy />);
    await screen.findByRole('alert');
    first.unmount();
    render(<Lazy />);
    expect(await screen.findByText('Merch loaded')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
