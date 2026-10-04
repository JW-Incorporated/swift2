import { describe, expect, it } from 'vitest';
import { readLocalText } from './read-local';

function xhr(result: { readyState?: number; responseText: string; error?: boolean }) {
  return () => {
    const x = {
      onreadystatechange: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readyState: 0,
      responseText: '',
      status: 0,
      open() {},
      send() {
        queueMicrotask(() => {
          if (result.error) return x.onerror?.();
          x.readyState = result.readyState ?? 4;
          x.responseText = result.responseText;
          x.onreadystatechange?.();
        });
      },
    };
    return x;
  };
}

describe('readLocalText', () => {
  it('uses fetch when it works', async () => {
    const r = await readLocalText('file:///a.json', { fetch: async () => ({ text: async () => '{"a":1}' }) });
    expect(r).toMatchObject({ text: '{"a":1}', via: 'fetch' });
    expect(r.attempts).toEqual([{ method: 'fetch', ok: true }]);
  });

  it('falls back to XHR when fetch rejects (Chromium file:), success at readyState 4 with status 0', async () => {
    const r = await readLocalText('file:///a.json', {
      fetch: async () => {
        throw new TypeError('Fetch API cannot load file:');
      },
      xhr: xhr({ responseText: '{"b":2}' }),
    });
    expect(r).toMatchObject({ text: '{"b":2}', via: 'xhr' });
    expect(r.attempts.map((a) => [a.method, a.ok])).toEqual([
      ['fetch', false],
      ['xhr', true],
    ]);
  });

  it('treats an empty XHR body as failure and reports both attempts', async () => {
    const r = await readLocalText('file:///a.json', {
      fetch: async () => ({ text: async () => '' }),
      xhr: xhr({ responseText: '' }),
    });
    expect(r.text).toBeNull();
    expect(r.via).toBeNull();
    expect(r.attempts.map((a) => a.ok)).toEqual([false, false]);
  });

  it('reports an XHR network error', async () => {
    const r = await readLocalText('file:///a.json', {
      fetch: async () => {
        throw new Error('blocked');
      },
      xhr: xhr({ responseText: '', error: true }),
    });
    expect(r.text).toBeNull();
    expect(r.attempts[1]).toMatchObject({ method: 'xhr', ok: false });
  });
});
