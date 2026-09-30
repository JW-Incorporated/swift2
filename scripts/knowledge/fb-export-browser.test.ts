import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { launchCollectorBrowser, plainChromeArgs } from './fb-export-browser.mjs';

describe('collector browser launch', () => {
  it('starts Chrome with only the profile, a self-chosen debugging port and first-run flags', () => {
    const args = plainChromeArgs('C:/p');
    expect(args).toEqual([
      '--user-data-dir=C:/p',
      '--remote-debugging-port=0',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ]);
    // None of puppeteer.launch()'s automation switches.
    expect(args.join(' ')).not.toMatch(/enable-automation|disable-extensions|disable-sync|headless/);
  });

  it('attaches to the endpoint Chrome publishes in DevToolsActivePort', async () => {
    const profileDir = await mkdtemp(join(tmpdir(), 'fb-browser-'));
    const connect = vi.fn(async (options: unknown) => ({ connectedWith: options }));
    const spawnImpl = vi.fn(() => {
      // Chrome writes the file shortly after start.
      setTimeout(
        () => void writeFile(join(profileDir, 'DevToolsActivePort'), '51234\n/devtools/browser/abc\n'),
        10,
      );
      return { unref: vi.fn() };
    });
    const browser = await launchCollectorBrowser({
      executablePath: process.execPath, // any existing file stands in for chrome.exe
      profileDir,
      spawnImpl: spawnImpl as never,
      connect: connect as never,
      sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.min(ms, 20))),
    });
    expect(spawnImpl).toHaveBeenCalledWith(process.execPath, plainChromeArgs(profileDir), expect.any(Object));
    expect(connect).toHaveBeenCalledWith({
      browserWSEndpoint: 'ws://127.0.0.1:51234/devtools/browser/abc',
      defaultViewport: null,
    });
    expect(browser).toEqual({
      connectedWith: {
        browserWSEndpoint: 'ws://127.0.0.1:51234/devtools/browser/abc',
        defaultViewport: null,
      },
    });
  });
});
