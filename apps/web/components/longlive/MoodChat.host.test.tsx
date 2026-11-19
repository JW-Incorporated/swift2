// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider } from '@swift2/ui';
import type { HostAdapter } from '@swift2/ui';
import { createWebAdapter } from '@/lib/host-adapter';
import { MoodChat } from '@swift2/ui/reader/clown/MoodChat';
import { TestHostProvider } from '@/lib/test-host';

const BODY = JSON.stringify({ text: 'happy' });

Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  vi.unstubAllGlobals();
});

function send() {
  fireEvent.change(screen.getByLabelText('How are you feeling?'), { target: { value: 'happy' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find songs' }));
}

describe('MoodChat goes through the host apiFetch', () => {
  it('sends through the host adapter apiFetch', async () => {
    const fetchMock = vi.fn(async () => new Response('{"kind":"unclear","message":"say more"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const base = createWebAdapter({ push() {}, replace() {} });
    const apiFetch = vi.fn(base.apiFetch);
    const adapter: HostAdapter = { ...base, apiFetch };
    render(createElement(HostProvider, { adapter }, createElement(MoodChat)));
    send();
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    expect(apiFetch).toHaveBeenCalledWith(
      {
        path: '/api/mood',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: BODY,
      },
      { signal: expect.any(AbortSignal) },
    );
    await screen.findByText('say more');
  });

  it('web host keeps the relative URL with identical method, headers and body', async () => {
    const fetchMock = vi.fn(async () => new Response('{"kind":"unclear","message":"say more"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(createElement(TestHostProvider, null, createElement(MoodChat)));
    send();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: BODY,
      signal: expect.any(AbortSignal),
    });
  });

  it('a non-2xx response shows the retry copy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    render(createElement(TestHostProvider, null, createElement(MoodChat)));
    send();
    await screen.findByText("That didn't go through. Try again in a moment?");
  });

  it('a 429 gets its own wording and keeps what the reader typed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })));
    render(createElement(TestHostProvider, null, createElement(MoodChat)));
    send();
    await screen.findByText('Too many requests, try again in a moment.');
    expect(screen.getByLabelText('How are you feeling?')).toHaveValue('happy');
  });

  it('a request that never answers ends in the error line with the input kept', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );
    const realSetTimeout = globalThis.setTimeout;
    const timeouts: number[] = [];
    vi.stubGlobal('setTimeout', ((fn: () => void, ms?: number, ...rest: unknown[]) => {
      if (ms === 30_000) {
        timeouts.push(ms);
        return realSetTimeout(fn, 20);
      }
      return realSetTimeout(fn, ms, ...rest);
    }) as typeof setTimeout);
    render(createElement(TestHostProvider, null, createElement(MoodChat)));
    send();
    await screen.findByText("That didn't go through. Try again in a moment?");
    expect(timeouts).toEqual([30_000]);
    expect(screen.getByLabelText('How are you feeling?')).toHaveValue('happy');
  });
});
