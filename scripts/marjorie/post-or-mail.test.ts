import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  vi.spyOn(console, 'error').mockImplementation(() => {});
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

  it('reports only numeric transport metadata when delivery fails', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue({ ...failResult,
      chunks: 3, delivered: 1, status: 404,
      error: 'request to https://discord.com/api/webhooks/private-token failed',
    });
    await main([...baseArgv(), '--no-mail-fallback']);
    expect(console.error).toHaveBeenCalledWith('discord-delivery: status=404 delivered=1 chunks=3');
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).not.toContain('private-token');
  });

  it('falls back to email and exits 0 when send-mail.py actually sends', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue(failResult);
    const spawnImpl = vi.fn().mockReturnValue({ status: 0, stdout: 'Mailed [[discord failed] Test subject] To sffan15@gmail.com\n' });

    const exitCode = await main(baseArgv(), { spawnImpl });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith('delivered: email');
    expect(spawnImpl).toHaveBeenCalledTimes(1);
  });

  it('prints the numeric 429 cooldown without provider text or URLs', async () => {
    vi.spyOn(discordMjs, 'post').mockResolvedValue({ ...failResult,
      status: 429, retryAfterMs: 180_000,
      error: 'provider says retry https://discord.com/api/webhooks/private-token',
    });
    await main([...baseArgv(), '--no-mail-fallback']);
    expect(console.error).toHaveBeenCalledWith(
      'discord-delivery: status=429 delivered=0 chunks=1 retryAfterMs=180000',
    );
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).not.toContain('private-token');
  });

  it.each(['https://discord.com/api/webhooks/private-token', -1, Infinity, Number.NaN, null])(
    'does not print invalid cooldown metadata %j', async (retryAfterMs) => {
      vi.spyOn(discordMjs, 'post').mockResolvedValue({ ...failResult, status: 429, retryAfterMs });
      await main([...baseArgv(), '--no-mail-fallback']);
      expect(console.error).toHaveBeenCalledWith(
        'discord-delivery: status=429 delivered=0 chunks=1 retryAfterMs=unknown',
      );
    },
  );

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

  // t_85667a3c: a fresh-context review caught that an earlier revision
  // passed mentionUserIds to post() without ever writing a matching
  // `<@id>` mention token into the posted text — allowed_mentions is a
  // FILTER over mentions already present in content, not an injector, so
  // that revision pinged nobody despite claiming to. These tests assert
  // the actual text handed to post(), not just exit codes.
  describe('--mention-founder', () => {
    const FOUNDER_MENTION = '<@338508192755482626>';

    it('prepends the founder mention token to the Discord-bound text when set', async () => {
      const postSpy = vi.spyOn(discordMjs, 'post').mockResolvedValue(okResult);

      await main([...baseArgv(), '--mention-founder']);

      expect(postSpy).toHaveBeenCalledTimes(1);
      const [discordText, opts] = postSpy.mock.calls[0];
      expect(discordText.startsWith(FOUNDER_MENTION)).toBe(true);
      expect(discordText).toContain('the brief body');
      expect(opts.mentionUserIds).toEqual(['338508192755482626']);
    });

    it('does NOT prepend a mention or set mentionUserIds when the flag is absent (no regression for existing callers)', async () => {
      const postSpy = vi.spyOn(discordMjs, 'post').mockResolvedValue(okResult);

      await main(baseArgv());

      expect(postSpy).toHaveBeenCalledTimes(1);
      const [discordText, opts] = postSpy.mock.calls[0];
      expect(discordText).toBe('the brief body');
      expect(opts.mentionUserIds).toEqual([]);
    });

    it('never leaks the raw Discord mention token into the mail fallback body', async () => {
      vi.spyOn(discordMjs, 'post').mockResolvedValue(failResult);
      const spawnImpl = vi.fn().mockReturnValue({ status: 0, stdout: 'Mailed [[discord failed] Test subject] To sffan15@gmail.com\n' });

      await main([...baseArgv(), '--mention-founder'], { spawnImpl });

      expect(spawnImpl).toHaveBeenCalledTimes(1);
      const payloadPath = spawnImpl.mock.calls[0][1][1];
      const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
      expect(payload.body).toBe('the brief body');
      expect(payload.body).not.toContain(FOUNDER_MENTION);
    });
  });
});
