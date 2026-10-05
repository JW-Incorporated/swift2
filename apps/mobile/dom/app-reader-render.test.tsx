// @vitest-environment jsdom
// The real AppReader read path: readLocalText (the <script> twin, executed as the browser would) ->
// snapshotFromEnvelope -> fill -> loadReader -> rendered reader -> onReady. Only the CSS import and the browser's
// script loader are stood in; the twin text is the real lastGoodScriptSource output for the real fixture bundle.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../web/node_modules/react-dom'));
vi.mock('./reader-spike.css', () => ({}));
vi.mock('expo-file-system', () => ({ File: class {}, Directory: class {}, Paths: { document: { uri: 'file:///doc' } } }));

// loadReader pulls the shell with call-time require() (Metro lazy eval), which vitest's Node require cannot resolve for
// TS/TSX sources ("Cannot find module './shims/fill-extensions'"), so it is the one stand-in here: it keeps the real
// extension pour and renders the real snapshot it was handed. Everything upstream of it is the production code.
vi.mock('./reader/reader-modules', async () => {
  const React = await import('react');
  const { fillExtensions } = await import('./reader/shims/fill-extensions');
  return {
    loadReader: (core: { domains: { eras: { name: string }[] } }, ext: never) => {
      fillExtensions(ext);
      return () => React.createElement('main', { 'data-reader': '' }, core.domains.eras.map((e) => e.name).join(','));
    },
  };
});

import AppReader from './AppReader';
import { lastGoodScriptSource } from '../lib/vault-storage';

const dir = join(process.cwd(), 'packages/content/src/fixtures/bundle');
const readJson = (p: string) => JSON.parse(readFileSync(join(dir, p), 'utf8')) as unknown;
function fixtureEnvelope(): string {
  const manifest = readJson('manifest.json') as { files: Record<string, { path: string }> };
  const files: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(manifest.files)) files[k] = readJson(v.path);
  return JSON.stringify({ manifest, files });
}

const TWIN_URI = 'file:///doc/last-good.v2.js?v=1';
let twin = '';
let scriptsLoaded: string[] = [];

/** jsdom does not fetch scripts: run the twin text where the browser would, then fire load/error. */
function installScriptLoader() {
  const orig = document.head.appendChild.bind(document.head);
  vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => {
    if (node instanceof HTMLScriptElement && node.src) {
      scriptsLoaded.push(node.getAttribute('src') ?? '');
      queueMicrotask(() => {
        if (!twin) return void node.onerror?.(new Event('error'));
        (0, eval)(twin);
        node.onload?.(new Event('load'));
      });
      return node;
    }
    return orig(node);
  }) as typeof document.head.appendChild);
}

const props = () => ({
  onReady: vi.fn(async () => {}),
  reportError: vi.fn(async (_m: string) => {}),
  reportProbe: vi.fn(async (_j: string) => {}),
});

/** Render, let the read pipeline settle, then drive the two rAFs that gate onReady. */
async function mountAndSettle(p: ReturnType<typeof props>, extra: Record<string, unknown> = {}) {
  const raf: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => void raf.push(cb));
  const view = render(<AppReader dom={{}} cacheUri={TWIN_URI} cacheJsonUri="file:///doc/last-good.json" {...p} {...extra} />);
  await vi.waitFor(() => expect(raf.length).toBeGreaterThan(0));
  for (let i = 0; i < 2; i++) {
    const cb = raf.shift();
    await act(async () => void (await (cb as unknown as () => unknown)()));
  }
  return view;
}

beforeEach(() => {
  scriptsLoaded = [];
  twin = '';
  installScriptLoader();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AppReader over the real read -> snapshot -> fill -> loadReader pipeline', () => {
  it('v2 object-literal twin: renders the reader with fixture data, fires onReady once, reports no error', async () => {
    const json = fixtureEnvelope();
    twin = lastGoodScriptSource(json);
    expect(twin).toMatch(/^globalThis\.__swift2LastGood=\{/);
    const p = props();
    const { container } = await mountAndSettle(p);
    expect(scriptsLoaded).toEqual([TWIN_URI]);
    expect(container.textContent).not.toContain('Reader unavailable');
    expect(container.textContent?.toLowerCase()).toContain('folklore');
    expect(p.onReady).toHaveBeenCalledTimes(1);
    expect(p.reportError).not.toHaveBeenCalled();
    const probe = JSON.parse(p.reportProbe.mock.calls.at(-1)![0]) as { version: string; error: string | null };
    expect(probe.version).toBe((JSON.parse(json) as { manifest: { bundleVersion: string } }).manifest.bundleVersion);
    expect(probe.error).toBeNull();
  });

  it('legacy string twin (an older build wrote it): same visible reader, no error', async () => {
    const json = fixtureEnvelope();
    twin = `globalThis.__swift2LastGood=${JSON.stringify(json)};`;
    const p = props();
    const { container } = await mountAndSettle(p);
    expect(container.textContent?.toLowerCase()).toContain('folklore');
    expect(p.onReady).toHaveBeenCalledTimes(1);
    expect(p.reportError).not.toHaveBeenCalled();
  });

  it('an unreadable twin with no XHR/fetch fallback reports the failure instead of rendering, and never signals ready', async () => {
    twin = '';
    vi.stubGlobal('XMLHttpRequest', class { open() {} send() { (this as unknown as { onerror: () => void }).onerror(); } });
    vi.stubGlobal('fetch', async () => ({ text: async () => '' }));
    const p = props();
    const { container } = render(<AppReader dom={{}} cacheUri={TWIN_URI} cacheJsonUri="file:///doc/last-good.json" {...p} />);
    await vi.waitFor(() => expect(p.reportError).toHaveBeenCalledTimes(1));
    expect(String(p.reportError.mock.calls[0]![0])).toMatch(/^reader-spike: unreadable /);
    expect(container.textContent).toContain('Reader unavailable');
    expect(p.onReady).not.toHaveBeenCalled();
  });

  it('page-level errors are reported with their prefix, except the twin script own error', async () => {
    twin = lastGoodScriptSource(fixtureEnvelope());
    const p = props();
    await mountAndSettle(p);
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: TWIN_URI }));
    expect(p.reportError).not.toHaveBeenCalled();
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', filename: 'other.js' }));
    expect(p.reportError).toHaveBeenCalledWith('error: boom');
  });
});
