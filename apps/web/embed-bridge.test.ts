// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SRC = readFileSync(join(__dirname, 'public', 'embed-bridge.js'), 'utf8');

function boot(provider: string) {
  document.body.innerHTML = '<iframe></iframe>';
  const frame = document.querySelector('iframe')!;
  const posted: Array<{ type: string }> = [];
  vi.spyOn(window, 'postMessage').mockImplementation(((msg: { type: string }) => {
    posted.push(msg);
  }) as never);
  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    value: { getAttribute: () => provider },
  });
  (0, eval)(SRC);
  const fromProvider = (
    origin: string,
    data: unknown,
    source: Window | null = frame.contentWindow,
  ) => window.dispatchEvent(new MessageEvent('message', { origin, data, source }));
  return { frame, posted, fromProvider };
}

describe('embed-bridge provider handshake', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('youtube: onReady relays embed-ready once; onError relays embed-error', () => {
    const { posted, fromProvider } = boot('youtube');
    fromProvider('https://www.youtube-nocookie.com', JSON.stringify({ event: 'onReady' }));
    fromProvider('https://www.youtube-nocookie.com', JSON.stringify({ event: 'onReady' }));
    expect(posted.map((p) => p.type)).toEqual(['embed-ready']);
  });

  it('youtube: onError relays embed-error', () => {
    const { posted, fromProvider } = boot('youtube');
    fromProvider(
      'https://www.youtube-nocookie.com',
      JSON.stringify({ event: 'onError', info: 153 }),
    );
    expect(posted.map((p) => p.type)).toEqual(['embed-error']);
  });

  it('youtube: ignores wrong origin and foreign source', () => {
    const { posted, fromProvider } = boot('youtube');
    fromProvider('https://evil.example', JSON.stringify({ event: 'onReady' }));
    fromProvider('https://www.youtube-nocookie.com', JSON.stringify({ event: 'onReady' }), window);
    expect(posted).toEqual([]);
  });

  it('spotify: relays the embed ready message from open.spotify.com only', () => {
    const { posted, fromProvider } = boot('spotify');
    fromProvider('https://evil.example', { type: 'ready' });
    expect(posted).toEqual([]);
    fromProvider('https://open.spotify.com', { type: 'ready' });
    expect(posted.map((p) => p.type)).toEqual(['embed-ready']);
  });
});
