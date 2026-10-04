import { describe, expect, it } from 'vitest';
import { readLocalText, unreadableMessage } from './read-local';

function xhr(result: { readyState?: number; responseText: string; error?: boolean }, seen?: string[]) {
  return () => {
    const x = {
      onreadystatechange: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readyState: 0,
      responseText: '',
      status: 0,
      open(_m: string, u: string) {
        seen?.push(u);
      },
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

// The node test env has no `document`, so the script attempt fails first unless a fake doc is passed.
describe('readLocalText', () => {
  it('falls through script and xhr to fetch', async () => {
    const r = await readLocalText('file:///a.json', {
      xhr: xhr({ responseText: '', error: true }),
      fetch: async () => ({ text: async () => '{"a":1}' }),
    });
    expect(r).toMatchObject({ text: '{"a":1}', via: 'fetch' });
    expect(r.attempts.map((a) => [a.method, a.ok])).toEqual([
      ['script', false],
      ['xhr', false],
      ['fetch', true],
    ]);
  });

  it('uses XHR before fetch, success at readyState 4 with status 0', async () => {
    const r = await readLocalText('file:///a.json', {
      fetch: async () => {
        throw new TypeError('Fetch API cannot load file:');
      },
      xhr: xhr({ responseText: '{"b":2}' }),
    });
    expect(r).toMatchObject({ text: '{"b":2}', via: 'xhr' });
    expect(r.attempts.map((a) => [a.method, a.ok])).toEqual([
      ['script', false],
      ['xhr', true],
    ]);
  });

  it('treats an empty XHR body as failure and reports all attempts', async () => {
    const r = await readLocalText('file:///a.json', {
      fetch: async () => ({ text: async () => '' }),
      xhr: xhr({ responseText: '' }),
    });
    expect(r.text).toBeNull();
    expect(r.via).toBeNull();
    expect(r.attempts.map((a) => a.ok)).toEqual([false, false, false]);
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

  describe('script read (iOS file:// fetch/XHR blocked)', () => {
    const fakeDoc = (set: (g: Record<string, unknown>) => void, fail = false) => {
      const el: { src?: string; onload?: () => void; onerror?: () => void; removed?: boolean; remove(): void } = {
        remove() {
          el.removed = true;
        },
      };
      const doc = {
        createElement: () => el,
        head: {
          appendChild: () =>
            queueMicrotask(() => {
              if (fail) return el.onerror?.();
              set(globalThis as unknown as Record<string, unknown>);
              el.onload?.();
            }),
        },
      } as unknown as Document;
      return { doc, el };
    };

    it('reads the global via a script element when fetch and XHR both fail, then cleans up', async () => {
      const { doc, el } = fakeDoc((g) => {
        g.__swift2LastGood = '{"c":3}';
      });
      const r = await readLocalText('file:///a.js', {
        doc,
        fetch: async () => {
          throw new TypeError('blocked');
        },
        xhr: xhr({ responseText: '', error: true }),
      });
      expect(r).toMatchObject({ text: '{"c":3}', via: 'script' });
      expect(r.attempts).toEqual([{ method: 'script', ok: true }]);
      expect(el.src).toBe('file:///a.js');
      expect(el.removed).toBe(true);
      expect('__swift2LastGood' in globalThis).toBe(false);
    });

    it('strips a ?v= cache-buster when deriving the .json twin', async () => {
      const { doc } = fakeDoc(() => {}, true);
      const seen: string[] = [];
      await readLocalText('file:///a.js?v=99', { doc, xhr: xhr({ responseText: 'X' }, seen) });
      expect(seen).toEqual(['file:///a.json']);
    });

    it('falls to XHR on script error and reads the .json twin', async () => {
      const { doc } = fakeDoc(() => {}, true);
      const seen: string[] = [];
      const r = await readLocalText('file:///a.js', { doc, xhr: xhr({ responseText: 'X' }, seen) });
      expect(r).toMatchObject({ text: 'X', via: 'xhr' });
      expect(seen).toEqual(['file:///a.json']);
    });
  });
});

describe('unreadableMessage', () => {
  it('stays under 120 chars even with long errors, and names the no-cache case', () => {
    const long = 'e'.repeat(120);
    const attempts = [
      { method: 'fetch' as const, ok: false, error: long },
      { method: 'xhr' as const, ok: false, error: long },
      { method: 'script' as const, ok: false, error: long },
    ];
    expect(unreadableMessage(attempts, true).length).toBeLessThan(120);
    const none = unreadableMessage([], false);
    expect(none).toContain('script=fail');
    expect(none).toContain('uri=null');
    expect(none.length).toBeLessThan(120);
  });
});
