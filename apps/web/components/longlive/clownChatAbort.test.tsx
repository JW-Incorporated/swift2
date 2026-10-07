// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { HostProvider, type ApiStream } from '@swift2/ui';
import { ClownChat } from './ClownChat';
import { LORE } from '@/lib/longlive/clownbot-lore';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { createWebAdapter } from '@/lib/host-adapter';

type Call = { signal?: AbortSignal; pulled: number };

function setup() {
  const calls: Call[] = [];
  const apiStream: ApiStream = (_req, opts) => {
    const call: Call = { signal: opts?.signal, pulled: 0 };
    calls.push(call);
    return (async function* () {
      for (;;) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, 5);
          opts?.signal?.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
        call.pulled += 1;
        yield '\n';
      }
    })();
  };
  const adapter = { ...createWebAdapter({ push() {}, replace() {} }), apiStream };
  const ui = (
    <HostProvider adapter={adapter}>
      <AppProvider>
        <ClownChat lore={LORE} />
      </AppProvider>
    </HostProvider>
  );
  return { calls, ui };
}

function send(text: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
  fireEvent.click(screen.getByLabelText('Send to clown bot'));
}

describe('ClownChat abort', () => {
  it('unmount mid-stream aborts the request and stops consuming', async () => {
    const { calls, ui } = setup();
    const { unmount } = renderWithReader(ui);
    send('hello');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].signal?.aborted).toBe(false);
    unmount();
    expect(calls[0].signal?.aborted).toBe(true);
    const pulled = calls[0].pulled;
    await new Promise((r) => setTimeout(r, 30));
    expect(calls[0].pulled).toBe(pulled);
  });

  it('a non-abort failure still shows the network error, an unmount abort shows none', async () => {
    const failing = { ...createWebAdapter({ push() {}, replace() {} }), apiStream: (() => (async function* () { throw new Error('500'); })()) as ApiStream };
    renderWithReader(
      <HostProvider adapter={failing}>
        <AppProvider>
          <ClownChat lore={LORE} />
        </AppProvider>
      </HostProvider>,
    );
    send('hello');
    expect(await screen.findByText("That didn't go through. Try again in a moment?")).toBeInTheDocument();
  });

  it('unmount while the stream is pending: late rejection is swallowed with no console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let signal: AbortSignal | undefined;
    let rejectStream!: (e: unknown) => void;
    const apiStream: ApiStream = (_req, opts) => {
      signal = opts?.signal;
      return (async function* () {
        await new Promise<void>((_, reject) => {
          rejectStream = reject;
        });
        yield '';
      })();
    };
    const adapter = { ...createWebAdapter({ push() {}, replace() {} }), apiStream };
    const { unmount } = renderWithReader(
      <HostProvider adapter={adapter}>
        <AppProvider>
          <ClownChat lore={LORE} />
        </AppProvider>
      </HostProvider>,
    );
    send('hello');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      rejectStream(new DOMException('aborted', 'AbortError'));
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
