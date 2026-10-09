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
    expect(apiFetch).toHaveBeenCalledWith({
      path: '/api/mood',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: BODY,
    });
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
    });
  });

  it('a non-2xx response shows the retry copy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    render(createElement(TestHostProvider, null, createElement(MoodChat)));
    send();
    await screen.findByText("That didn't go through. Try again in a moment?");
  });
});
