import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { main } from './post-or-mail.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import * as discordMjs from './lib/discord.mjs';

let dir: string;
let bodyFile: string;
let logSpy: ReturnType<typeof vi.spyOn>;

const okResult = { ok: true, chunks: 1, delivered: 1, status: null, error: null };
const failResult = { ok: false, chunks: 1, delivered: 0, status: 500, error: 'Discord delivery failed with HTTP 500' };

const baseArgv = () => ['--subject', 'Test subject', '--body-file', bodyFile, '--url', 'https://github.com/JW-Incorporated/swift2/issues/1'];

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'post-or-mail-test-'));
  bodyFile = path.join(dir, 'body.txt');
  writeFileSync(bodyFile, 'the brief body');
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

describe('main()', () => {
  it('prints "delivered: discord" and exits 0 when post() succeeds', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue(okResult);
    const spawnImpl = vi.fn();

    const exitCode = await main(baseArgv(), { spawnImpl });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith('delivered: discord');
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it('falls back to email and exits 0 when send-mail.py actually sends', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue(failResult);
    const spawnImpl = vi.fn().mockReturnValue({ status: 0, stdout: 'Mailed [[discord failed] Test subject] To sffan15@gmail.com\n' });

    const exitCode = await main(baseArgv(), { spawnImpl });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith('delivered: email');
    expect(spawnImpl).toHaveBeenCalledTimes(1);
  });

  it('reports "delivered: neither" and exits non-zero when send-mail.py silently skips (unset creds)', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue(failResult);
    const spawnImpl = vi.fn().mockReturnValue({
      status: 0,
      stdout: 'MARJORIE_EMAIL variable and/or GMAIL_APP_PASSWORD secret not set - skipping (see docs/agents/marjorie.md - Delivery; setup: issue #484).\n',
    });

    const exitCode = await main(baseArgv(), { spawnImpl });

    expect(exitCode).not.toBe(0);
    expect(logSpy).toHaveBeenCalledWith('delivered: neither');
  });

  it('with --no-mail-fallback: exits 0 on a Discord failure and never invokes the mail child process', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue(failResult);
    const spawnImpl = vi.fn();

    const exitCode = await main([...baseArgv(), '--no-mail-fallback'], { spawnImpl });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith('delivered: neither');
    expect(spawnImpl).not.toHaveBeenCalled();
  });
});
