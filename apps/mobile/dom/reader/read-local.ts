// WP0.5b: read a file:// URI from inside the DOM webview. Chromium rejects
// fetch() on file:, so XHR is the fallback; on file:// XHR reports status 0,
// so success is readyState 4 + non-empty responseText, never status 200.
export interface ReadAttempt {
  method: 'fetch' | 'xhr';
  ok: boolean;
  error?: string;
}

export interface ReadResult {
  text: string | null;
  via: 'fetch' | 'xhr' | null;
  attempts: ReadAttempt[];
}

interface XhrLike {
  open(method: string, url: string, async: boolean): void;
  send(): void;
  onreadystatechange: (() => void) | null;
  onerror: (() => void) | null;
  readyState: number;
  responseText: string;
}

export interface ReadDeps {
  fetch?: (uri: string) => Promise<{ text(): Promise<string> }>;
  xhr?: () => XhrLike;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 120);

function xhrRead(make: () => XhrLike, uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const x = make();
    x.onerror = () => reject(new Error('xhr error'));
    x.onreadystatechange = () => {
      if (x.readyState !== 4) return;
      if (x.responseText) resolve(x.responseText);
      else reject(new Error('xhr empty'));
    };
    x.open('GET', uri, true);
    x.send();
  });
}

export async function readLocalText(uri: string, deps: ReadDeps = {}): Promise<ReadResult> {
  const attempts: ReadAttempt[] = [];
  const doFetch = deps.fetch ?? (globalThis.fetch as unknown as ReadDeps['fetch']);
  const makeXhr = deps.xhr ?? (() => new XMLHttpRequest() as unknown as XhrLike);
  try {
    if (!doFetch) throw new Error('no fetch');
    const text = await (await doFetch(uri)).text();
    if (!text) throw new Error('fetch empty');
    attempts.push({ method: 'fetch', ok: true });
    return { text, via: 'fetch', attempts };
  } catch (e) {
    attempts.push({ method: 'fetch', ok: false, error: msg(e) });
  }
  try {
    const text = await xhrRead(makeXhr, uri);
    attempts.push({ method: 'xhr', ok: true });
    return { text, via: 'xhr', attempts };
  } catch (e) {
    attempts.push({ method: 'xhr', ok: false, error: msg(e) });
  }
  return { text: null, via: null, attempts };
}

/** Whether a classic <script src> of `uri` loads (content is not read; used only as a probe). */
export function probeScript(uri: string, doc: Document = document): Promise<boolean> {
  return new Promise((resolve) => {
    const s = doc.createElement('script');
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    s.src = uri;
    doc.head.appendChild(s);
  });
}
