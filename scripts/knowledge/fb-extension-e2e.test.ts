// FB-EXTENSION-1 end-to-end: the REAL background.js + content.js (+ harvest-core.js, comments.js)
// in a fake Chrome, wired to the REAL receiver (startReceiver) over real HTTP on port 0.
// Synthetic fixtures only — no real Facebook post or comment text, no live Facebook.
//
// The fake is deliberately strict where real Chrome is:
//  - runtime.onMessage: a listener that neither answers synchronously nor returns `true` closes the
//    port → the sender's callback gets undefined + runtime.lastError.
//  - a response to a page that has navigated away is dropped (the port died with the frame).
//  - tabs.update resolves before the page loads; content scripts run at document_idle on pages
//    whose URL matches manifest.content_scripts[].matches; tabs.onUpdated fires 'complete' after.
//  - storage.session enforces QUOTA_BYTES (10 MiB, Chrome 112+) and rejects an over-quota set().
//  - fetch from the worker is CORS-exempt only for URLs matching manifest.host_permissions
//    (Chrome match patterns: an omitted port matches every port); anything else gets a real
//    OPTIONS preflight against the receiver first.
//  - optional idle kill: the worker is torn down and re-booted before a message, as Chrome does
//    with an idle MV3 service worker (state survives only in storage.session / alarms).
// Every extension timer runs SCALE× faster (the heartbeat's 30 s → 300 ms).
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import { startReceiver } from './fb-export-receiver.mjs';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const DIR =
  process.env.LLFB_EXT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'fb-extension');
const MANIFEST = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
const SCALE = 100;
const QUOTA_BYTES = 10 * 1024 * 1024;
const EXT_ID = 'llfbtestextensionid';
const TOKEN = 'c0ffee'.repeat(10) + 'abcd';

const realSetTimeout = setTimeout;
const tick = (ms = 0) => new Promise((resolve) => realSetTimeout(resolve, ms));

// Chrome match pattern → does `url` match? (scheme://host[:port]/path; omitted port = any port)
export function matchesPattern(pattern: string, url: string) {
  const parts = /^(\*|https?):\/\/([^/]+)(\/.*)$/.exec(pattern);
  if (!parts) return false;
  const target = new URL(url);
  const [, scheme, hostPort, path] = parts;
  if (scheme !== '*' && `${scheme}:` !== target.protocol) return false;
  const [host, port] = hostPort.split(':');
  if (host !== target.hostname) return false;
  if (port !== undefined && port !== '*' && port !== target.port) return false;
  const escaped = path.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('.*')}$`).test(target.pathname + target.search);
}

function sizeOf(store: Record<string, string>) {
  return Object.entries(store).reduce(
    (sum, [key, json]) => sum + Buffer.byteLength(key) + Buffer.byteLength(json),
    0,
  );
}

type Feed = { initial: string[]; more: string[] };

// A post needs Facebook's story-message container: the uploaded html is built positively from it.
// Each carries a CONFIRMED "0 comments" bar: an absent count is unknown, so it would be eligible
// for comment collection (Codex round 5 #1) and fail the group when no comments come back.
const post = (position: number, age: string, filler = '') =>
  `<div aria-posinset="${position}"><div role="article"><a aria-label="Fan ${position}">Fan</a>` +
  `<a href="/groups/1234/posts/${position}/">${age}</a>` +
  `<div data-ad-preview="message">Synthetic post ${position} ${filler}</div>` +
  `<span>0 comments</span>` +
  `</div></div>`;

function createBrowser({
  feed,
  idleKill = false,
  killOnTabsUpdate = 0,
  navigateDelayMs = 2,
  staleComplete = false,
}: {
  feed: () => Feed;
  idleKill?: boolean;
  killOnTabsUpdate?: number;
  navigateDelayMs?: number;
  staleComplete?: boolean;
}) {
  let tabsUpdateKills = killOnTabsUpdate;
  const session: Record<string, string> = {};
  const alarms = new Map<string, Any>();
  const tabs = new Map<number, { url: string; pendingUrl?: string; dom: JSDOM | null }>();
  const fetches: string[] = [];
  const messages: string[] = [];
  const storageErrors: string[] = [];
  let worker: Any = null;
  let closed = false;

  function bootWorker() {
    const instance: Any = {
      alive: true,
      pending: 0,
      listeners: { message: [], updated: [], alarm: [] },
    };
    const guard = <T>(fn: () => Promise<T>): Promise<T> =>
      instance.alive ? fn() : new Promise<T>(() => {});
    const chrome = {
      runtime: {
        id: EXT_ID,
        getManifest: () => MANIFEST,
        onMessage: { addListener: (fn: Any) => instance.listeners.message.push(fn) },
      },
      storage: {
        session: {
          get: (key: string) =>
            guard(async () => (key in session ? { [key]: JSON.parse(session[key]) } : {})),
          set: (items: Record<string, Any>) =>
            guard(async () => {
              const next = { ...session };
              for (const [k, v] of Object.entries(items)) next[k] = JSON.stringify(v);
              if (sizeOf(next) > QUOTA_BYTES) {
                const message = 'Session storage quota bytes exceeded. Values were not stored.';
                storageErrors.push(message);
                throw new Error(message);
              }
              Object.assign(session, next);
            }),
        },
      },
      tabs: {
        update: (tabId: number, props: { url: string }) =>
          guard(async () => {
            if (tabsUpdateKills > 0) {
              // Chrome stops the worker while tabs.update is in flight; the navigation never
              // happens and the call never settles.
              tabsUpdateKills -= 1;
              instance.alive = false;
              return new Promise<{ id: number; url: string }>(() => {});
            }
            // The previous page's 'complete' can still be in flight when the navigation starts.
            const previous = tabs.get(tabId);
            if (staleComplete && previous) {
              const staleUrl = previous.url;
              realSetTimeout(() => {
                if (closed) return;
                const w = wake();
                for (const fn of w.listeners.updated)
                  fn(tabId, { status: 'complete' }, { id: tabId, url: staleUrl });
              });
            }
            navigate(tabId, props.url);
            return { id: tabId, url: props.url };
          }),
        get: (tabId: number) =>
          guard(async () => {
            const tab = tabs.get(tabId);
            if (!tab) throw new Error(`No tab with id: ${tabId}.`);
            return {
              id: tabId,
              url: tab.url,
              ...(tab.pendingUrl ? { pendingUrl: tab.pendingUrl } : {}),
            };
          }),
        onUpdated: { addListener: (fn: Any) => instance.listeners.updated.push(fn) },
        onRemoved: { addListener: () => undefined },
      },
      alarms: {
        create: (name: string, info: Any) => guard(async () => void scheduleAlarm(name, info)),
        clear: (name: string) =>
          guard(async () => {
            const alarm = alarms.get(name);
            if (alarm) clearTimeout(alarm.timer);
            return alarms.delete(name);
          }),
        get: (name: string) => guard(async () => alarms.get(name)?.info),
        onAlarm: { addListener: (fn: Any) => instance.listeners.alarm.push(fn) },
      },
    };
    const extFetch = (url: string, init: Any = {}) =>
      guard(async () => {
        const target = new URL(url);
        fetches.push(`${init.method ?? 'GET'} ${target.pathname}`);
        const exempt = (MANIFEST.host_permissions ?? []).some((p: string) =>
          matchesPattern(p, url),
        );
        if (!exempt) {
          // Not CORS-exempt: X-LLFB-Token is not a safelisted header → real preflight.
          const preflight = await fetch(url, {
            method: 'OPTIONS',
            headers: {
              Origin: `chrome-extension://${EXT_ID}`,
              'Access-Control-Request-Method': init.method ?? 'GET',
              'Access-Control-Request-Headers': 'content-type,x-llfb-token',
            },
          });
          if (!preflight.ok || !preflight.headers.get('access-control-allow-origin'))
            throw new TypeError('Failed to fetch (CORS preflight refused)');
        }
        return fetch(url, init);
      });
    const context: Any = vm.createContext({
      chrome,
      fetch: extFetch,
      console: { warn: () => {}, log: () => {}, error: () => {} },
      URL,
      setTimeout: (fn: () => void, ms = 0) =>
        realSetTimeout(() => instance.alive && fn(), ms / SCALE),
      clearTimeout,
    });
    context.self = context;
    context.importScripts = (...files: string[]) => {
      for (const file of files)
        vm.runInContext(readFileSync(join(DIR, file), 'utf8'), context, { filename: file });
    };
    vm.runInContext(readFileSync(join(DIR, 'background.js'), 'utf8'), context, {
      filename: 'background.js',
    });
    return instance;
  }

  function wake() {
    if (!worker || !worker.alive) worker = bootWorker();
    else if (idleKill && worker.pending === 0) {
      worker.alive = false; // Chrome stopped the idle worker; a new one boots for this event
      worker = bootWorker();
    }
    return worker;
  }

  function scheduleAlarm(name: string, info: Any) {
    const previous = alarms.get(name);
    if (previous) clearTimeout(previous.timer);
    const fire = () => {
      if (closed || !alarms.has(name)) return;
      const w = wake();
      for (const fn of w.listeners.alarm) fn({ name });
      if (info.periodInMinutes) {
        alarms.get(name).timer = realSetTimeout(fire, (info.periodInMinutes * 60_000) / SCALE);
      } else alarms.delete(name);
    };
    const delayMs = ((info.delayInMinutes ?? info.periodInMinutes ?? 1) * 60_000) / SCALE;
    alarms.set(name, { info, timer: realSetTimeout(fire, delayMs) });
  }

  function dispatchMessage(tabId: number, win: Any, message: Any, callback?: (r: Any) => void) {
    const payload = JSON.parse(JSON.stringify(message ?? null));
    const senderUrl = String(win.location.href);
    realSetTimeout(() => {
      if (closed) return;
      messages.push(payload?.type);
      const w = wake();
      const sender = { id: EXT_ID, url: senderUrl, tab: { id: tabId, url: tabs.get(tabId)?.url } };
      let settled = false;
      const deliver = (response: Any, lastError?: string) => {
        if (settled) return;
        settled = true;
        w.pending -= 1;
        if (!callback || tabs.get(tabId)?.dom?.window !== win) return; // frame gone → dropped
        realSetTimeout(() => {
          win.chrome.runtime.lastError = lastError ? { message: lastError } : undefined;
          try {
            callback(response === undefined ? undefined : JSON.parse(JSON.stringify(response)));
          } finally {
            win.chrome.runtime.lastError = undefined;
          }
        });
      };
      w.pending += 1;
      let async = false;
      for (const fn of w.listeners.message) {
        if (fn(payload, sender, (r: Any) => deliver(r)) === true) async = true;
      }
      if (!async) deliver(undefined, 'The message port closed before a response was received.');
    });
  }

  async function loadPage(tabId: number, url: string) {
    const tab = tabs.get(tabId)!;
    tab.dom?.window.close();
    tab.url = url;
    delete tab.pendingUrl;
    let html = '<!doctype html><html><body></body></html>';
    const target = new URL(url);
    let growth: string[] = [];
    if (target.hostname === '127.0.0.1') html = await (await fetch(url)).text();
    if (target.hostname === 'www.facebook.com') {
      const { initial, more } = feed();
      growth = [...more];
      html = `<!doctype html><html><body><div role="feed">${initial.join('')}</div></body></html>`;
    }
    if (closed) return;
    const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
    tab.dom = dom;
    const win: Any = dom.window;
    for (const name of ['setTimeout', 'setInterval'] as const) {
      const original = win[name].bind(win);
      win[name] = (fn: Any, ms = 0, ...rest: Any[]) => original(fn, ms / SCALE, ...rest);
    }
    win.scrollBy = () => {
      const next = growth.shift();
      if (next) win.document.querySelector('[role="feed"]').insertAdjacentHTML('beforeend', next);
    };
    win.chrome = {
      runtime: {
        id: EXT_ID,
        lastError: undefined,
        sendMessage: (message: Any, callback?: (r: Any) => void) =>
          dispatchMessage(tabId, win, message, callback),
      },
    };
    const context = dom.getInternalVMContext();
    for (const entry of MANIFEST.content_scripts) {
      if (!entry.matches.some((pattern: string) => matchesPattern(pattern, url))) continue;
      for (const file of entry.js)
        vm.runInContext(readFileSync(join(DIR, file), 'utf8'), context, { filename: file });
    }
    realSetTimeout(() => {
      if (closed || tab.dom !== dom) return;
      const w = wake();
      for (const fn of w.listeners.updated) fn(tabId, { status: 'complete' }, { id: tabId, url });
    }, 5);
  }

  function navigate(tabId: number, url: string) {
    if (!tabs.has(tabId)) tabs.set(tabId, { url, dom: null });
    else tabs.get(tabId)!.pendingUrl = url; // committed on load (tab.url keeps the old page)
    realSetTimeout(() => void loadPage(tabId, url).catch(() => {}), navigateDelayMs);
  }

  return {
    session,
    alarms,
    fetches,
    messages,
    storageErrors,
    tabs,
    open(url: string) {
      wake(); // the worker exists before any page (installed extension)
      navigate(1, url);
    },
    close() {
      closed = true;
      if (worker) worker.alive = false;
      for (const alarm of alarms.values()) clearTimeout(alarm.timer);
      for (const tab of tabs.values()) tab.dom?.window.close();
    },
  };
}

describe('extension ↔ receiver end to end (fake Chrome, real HTTP)', () => {
  const cleanups: (() => Promise<void> | void)[] = [];
  afterEach(async () => {
    for (const fn of cleanups.splice(0)) await fn();
  });

  async function run({
    feed,
    stallMs,
    idleKill = false,
    killOnTabsUpdate = 0,
    navigateDelayMs,
    staleComplete,
  }: {
    feed: () => Feed;
    stallMs: number;
    idleKill?: boolean;
    killOnTabsUpdate?: number;
    navigateDelayMs?: number;
    staleComplete?: boolean;
  }) {
    const root = mkdtempSync(join(tmpdir(), 'llfb-e2e-'));
    const stored: Any[] = [];
    const log: string[] = [];
    const receiver = await startReceiver({
      groups: [{ slug: 'vault', label: 'Vault', groupId: '1234', wallBudgetMs: 75 * 60_000 }],
      token: TOKEN,
      root,
      outputDir: join(root, 'out'),
      stallMs,
      storeComments: async (args: Any) => {
        stored.push(args);
        return { posts: args.comments.length, comments: 0, replies: 0 };
      },
      log: (line: string) => log.push(line),
    });
    const browser = createBrowser({
      feed,
      idleKill,
      killOnTabsUpdate,
      navigateDelayMs,
      staleComplete,
    });
    cleanups.push(async () => {
      browser.close();
      await receiver.close();
      rmSync(root, { recursive: true, force: true });
    });
    browser.open(receiver.url);
    const results = await Promise.race([receiver.done, tick(20_000).then(() => 'timeout')]);
    return { results, browser, log, stored };
  }

  it('start → next → harvest with heartbeats → result → finished', async () => {
    // 40 recent posts appear one per scroll step (~1–2 s of scrolling at SCALE), then 3 old
    // posts end the feed (seven-days). The 1 s stall watchdog only survives on heartbeats.
    const feed = () => ({
      initial: [post(1, '1 h'), post(2, '1 h'), post(3, '2 h'), post(4, '2 h')],
      more: [
        ...Array.from({ length: 40 }, (_, i) => post(5 + i, '3 h')),
        post(45, '9 d'),
        post(46, '10 d'),
        post(47, '11 d'),
      ],
    });
    const { results, browser, log } = await run({ feed, stallMs: 1_000 });
    expect(log).not.toContain('fb-receiver vault: stalled');
    expect(results, JSON.stringify({ results, log })).toMatchObject([
      { slug: 'vault', status: 'collected', recentCount: 44 },
    ]);
    expect(browser.fetches[0]).toBe('GET /hello'); // the /start token is validated first
    expect(browser.fetches).toContain('POST /heartbeat');
    expect(browser.fetches.filter((f) => f === 'POST /result')).toHaveLength(1);
    expect(browser.fetches.at(-1)).toBe('POST /finished');
    expect(browser.messages.slice(0, 2)).toEqual(['llfb-start', 'llfb-ready']);
    expect(results).toMatchObject([
      { commentCoverage: { eligible: 0, processed: 0, failed: 0, timedOut: 0 } },
    ]);
  }, 30_000);

  it('survives Chrome stopping the idle worker before every event', async () => {
    const feed = () => ({
      initial: [post(1, '1 h'), post(2, '1 h'), post(3, '2 h'), post(4, '2 h')],
      more: [
        ...Array.from({ length: 30 }, (_, i) => post(5 + i, '3 h')),
        post(35, '9 d'),
        post(36, '10 d'),
        post(37, '11 d'),
      ],
    });
    const { results, log } = await run({ feed, stallMs: 1_000, idleKill: true });
    expect(log).not.toContain('fb-receiver vault: stalled');
    expect(results, JSON.stringify({ results, log })).toMatchObject([
      { slug: 'vault', status: 'collected', recentCount: 34 },
    ]);
  }, 30_000);

  it('a worker restart mid tabs.update re-issues the navigation (Codex round 4 #2)', async () => {
    const feed = () => ({
      initial: [post(1, '1 h'), post(2, '2 h'), post(3, '9 d'), post(4, '10 d'), post(5, '11 d')],
      more: [],
    });
    // The stall watchdog (3 s) is longer than one wake-alarm period (60 s / SCALE = 600 ms).
    const { results, browser, log } = await run({ feed, stallMs: 3_000, killOnTabsUpdate: 1 });
    expect(log).not.toContain('fb-receiver vault: stalled');
    expect(results, JSON.stringify({ results, log })).toMatchObject([
      { slug: 'vault', status: 'collected', recentCount: 2 },
    ]);
    expect(browser.fetches.at(-1)).toBe('POST /finished');
    expect(browser.alarms.size).toBe(0);
  }, 30_000);

  // CI (PR #4658): the start page's 'complete' landed after the job was persisted while the
  // (slow, Vault-sized) group page was still loading; the off-group grace (8 s → 80 ms) then
  // reported the job failed{redirected}. The tab's current target decides, not a stale event.
  it('a stale complete from the previous page is not an off-group redirect', async () => {
    const feed = () => ({
      initial: [post(1, '1 h'), post(2, '2 h'), post(3, '9 d'), post(4, '10 d'), post(5, '11 d')],
      more: [],
    });
    // The group page takes 300 ms to load: well past the 80 ms off-group grace.
    const { results, browser, log } = await run({
      feed,
      stallMs: 3_000,
      staleComplete: true,
      navigateDelayMs: 300,
    });
    expect(results, JSON.stringify({ results, log })).toMatchObject([
      { slug: 'vault', status: 'collected', recentCount: 2 },
    ]);
    expect(browser.fetches.filter((f) => f === 'POST /result')).toHaveLength(1);
  }, 30_000);

  it('delivers a Vault-sized result larger than storage.session can hold', async () => {
    // Real group posts carry Facebook's full DOM: ~30 recent posts at a few hundred KB each is
    // more than chrome.storage.session's 10 MiB quota. Synthetic filler stands in for it.
    const filler = 'x'.repeat(450_000);
    const feed = () => ({
      initial: [
        ...Array.from({ length: 25 }, (_, i) => post(1 + i, '2 h', filler)),
        post(26, '9 d'),
        post(27, '10 d'),
        post(28, '11 d'),
      ],
      more: [],
    });
    const { results, browser, log } = await run({ feed, stallMs: 3_000 });
    expect(log).not.toContain('fb-receiver vault: stalled');
    expect(results, JSON.stringify({ results, log })).toMatchObject([
      { slug: 'vault', status: 'collected', recentCount: 25 },
    ]);
    expect(browser.fetches.at(-1)).toBe('POST /finished');
    expect(browser.storageErrors).toEqual([]);
    expect(browser.alarms.size).toBe(0);
  }, 60_000);

  it('host_permissions is load-bearing: the receiver refuses a CORS preflight', async () => {
    expect(matchesPattern(MANIFEST.host_permissions[0], 'http://127.0.0.1:53127/next')).toBe(true);
    expect(matchesPattern('http://127.0.0.1:80/*', 'http://127.0.0.1:53127/next')).toBe(false);
    const root = mkdtempSync(join(tmpdir(), 'llfb-e2e-'));
    const receiver = await startReceiver({
      groups: [],
      token: TOKEN,
      root,
      outputDir: root,
      log: () => {},
    });
    cleanups.push(async () => {
      await receiver.close();
      rmSync(root, { recursive: true, force: true });
    });
    const preflight = await fetch(`http://127.0.0.1:${receiver.port}/next`, {
      method: 'OPTIONS',
      headers: { 'Access-Control-Request-Method': 'GET' },
    });
    expect(preflight.status).toBe(403);
  });
});
