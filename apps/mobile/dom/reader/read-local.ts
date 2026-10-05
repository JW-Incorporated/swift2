// WP0.5b: read the native cache from inside the DOM webview. iOS WKWebView never enables
// allowFileAccessFromFileURLs, so fetch/XHR of a file:// URI fail there; <script src> is exempt, so the
// host hands over the `.js` twin of the cache (see vault-storage.ts) and script is tried first. On file://
// XHR reports status 0, so success is readyState 4 + non-empty responseText, never status 200.
export interface ReadAttempt {
  method: 'fetch' | 'xhr' | 'script';
  ok: boolean;
  error?: string;
}

export interface ReadResult {
  text: string | null;
  /** The twin's already-parsed object (new object-literal twins): hand it on, never re-parse. Null on the text paths. */
  parsed?: object | null;
  via: 'fetch' | 'xhr' | 'script' | null;
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
  doc?: Document;
  scriptTimeoutMs?: number;
}

export interface ReadUris {
  /** The `.js` twin (with its `?v=` cache-buster). */
  scriptUri: string;
  /** The `.json` for XHR/fetch. */
  jsonUri: string;
}

const SCRIPT_TIMEOUT_MS = 3000;

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

const GLOBAL_KEY = '__swift2LastGood';

/** Load `uri` (the `.js` twin) as a classic script, take what it parks on globalThis (the parsed object, or the JSON
 * text from an older string-form twin), then clean up. */
function scriptRead(uri: string, doc?: Document, timeoutMs = SCRIPT_TIMEOUT_MS): Promise<string | object> {
  return new Promise((resolve, reject) => {
    const d = doc ?? (typeof document === 'undefined' ? undefined : document);
    if (!d) return reject(new Error('no document'));
    const g = globalThis as unknown as Record<string, unknown>;
    const s = d.createElement('script');
    const done = () => {
      clearTimeout(timer);
      delete g[GLOBAL_KEY];
      s.remove?.();
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error('script timeout'));
    }, timeoutMs);
    s.onload = () => {
      const text = g[GLOBAL_KEY];
      done();
      if ((typeof text === 'string' && text) || (typeof text === 'object' && text !== null)) resolve(text);
      else reject(new Error('script empty'));
    };
    s.onerror = () => {
      done();
      reject(new Error('script error'));
    };
    s.src = uri;
    (d.head ?? d).appendChild(s);
  });
}

/** Order is script -> xhr -> fetch. the script reads the `.js` twin; fetch/XHR read the `.json`. */
export async function readLocalText({ scriptUri, jsonUri }: ReadUris, deps: ReadDeps = {}): Promise<ReadResult> {
  const attempts: ReadAttempt[] = [];
  const doFetch = deps.fetch ?? (globalThis.fetch as unknown as ReadDeps['fetch']);
  const makeXhr = deps.xhr ?? (() => new XMLHttpRequest() as unknown as XhrLike);
  try {
    const got = await scriptRead(scriptUri, deps.doc, deps.scriptTimeoutMs);
    attempts.push({ method: 'script', ok: true });
    if (typeof got === 'string') return { text: got, via: 'script', attempts };
    return { text: null, parsed: got, via: 'script', attempts };
  } catch (e) {
    attempts.push({ method: 'script', ok: false, error: msg(e) });
  }
  try {
    const text = await xhrRead(makeXhr, jsonUri);
    attempts.push({ method: 'xhr', ok: true });
    return { text, via: 'xhr', attempts };
  } catch (e) {
    attempts.push({ method: 'xhr', ok: false, error: msg(e) });
  }
  try {
    if (!doFetch) throw new Error('no fetch');
    const text = await (await doFetch(jsonUri)).text();
    if (!text) throw new Error('fetch empty');
    attempts.push({ method: 'fetch', ok: true });
    return { text, via: 'fetch', attempts };
  } catch (e) {
    attempts.push({ method: 'fetch', ok: false, error: msg(e) });
  }
  return { text: null, via: null, attempts };
}

/** The one-line failure report (kept under 120 chars: the watchdog truncates reasons there). */
export function unreadableMessage(attempts: ReadAttempt[], uriSet: boolean): string {
  const get = (m: ReadAttempt['method']) => attempts.find((a) => a.method === m);
  const err = (m: ReadAttempt['method']) => (get(m)?.error ?? 'none').slice(0, 24);
  const script = get('script')?.ok ? 'ok' : 'fail';
  return `reader-spike: unreadable fetch=${err('fetch')} xhr=${err('xhr')} script=${script} uri=${uriSet ? 'set' : 'null'}`;
}
