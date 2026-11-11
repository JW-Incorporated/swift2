import { describe, expect, it, vi } from 'vitest';
import {
  GAP_THRESHOLD_HOURS,
  checkPostingGap,
  evaluateGap,
  isFrozen,
  pingTree,
  readPostedTimestamps,
  renderResult,
} from './check-posting-gap.mjs';

const NOW = new Date('2026-10-15T12:00:00.000Z');

/** Hours before NOW, as the ISO instant a posted record would carry. */
function hoursAgo(hours: number) {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString();
}

function entry(name: string, postedAt: string) {
  return { name, postedAt, ms: Date.parse(postedAt) };
}

/** A fake social/posted/ — `{ filename: file contents }`. */
function fakeDir(files: Record<string, string>) {
  return {
    readDir: () => Object.keys(files),
    readFile: (path: string) => {
      const name = path.split(/[\\/]/).pop() as string;
      if (!(name in files)) throw new Error(`ENOENT: ${name}`);
      return files[name];
    },
  };
}

function posted(postedAt: string) {
  return JSON.stringify({ platform: 'x', postedAt, url: 'https://x.com/longlivetscom/status/1' });
}

describe('social posting-gap watchdog', () => {
  it('stays silent inside the threshold', () => {
    const result = evaluateGap({ entries: [entry('a.json', hoursAgo(12))], now: NOW });
    expect(result.status).toBe('ok');
    expect(result.hours).toBeCloseTo(12, 5);
    expect(renderResult(result, { now: NOW }).exitCode).toBe(0);
  });

  it('stays silent at exactly the threshold — the alarm is strictly "more than 48h"', () => {
    const result = evaluateGap({ entries: [entry('a.json', hoursAgo(GAP_THRESHOLD_HOURS))], now: NOW });
    expect(result.status).toBe('ok');
  });

  it('alarms just over the threshold', () => {
    const result = evaluateGap({
      entries: [entry('a.json', hoursAgo(GAP_THRESHOLD_HOURS + 0.5))],
      now: NOW,
    });
    expect(result.status).toBe('gap');
    const rendered = renderResult(result, { now: NOW });
    expect(rendered.exitCode).toBe(1);
    expect(rendered.body).toContain('48.5 hours');
    expect(rendered.treeLine).toContain('No new post has landed');
  });

  it('measures from the newest record, not the last one read', () => {
    const result = evaluateGap({
      entries: [entry('old.json', hoursAgo(300)), entry('new.json', hoursAgo(4)), entry('mid.json', hoursAgo(80))],
      now: NOW,
    });
    expect(result.status).toBe('ok');
    expect(result.newest?.name).toBe('new.json');
  });

  it('recovers — a fresh post clears a standing gap and renders a recovery line', () => {
    const result = evaluateGap({
      entries: [entry('stale.json', hoursAgo(120)), entry('fresh.json', hoursAgo(1))],
      now: NOW,
    });
    expect(result.status).toBe('ok');
    const rendered = renderResult(result, { now: NOW });
    expect(rendered.exitCode).toBe(0);
    expect(rendered.treeLine).toContain('Posting recovered');
  });

  it('is silent while SOCIAL_FREEZE is held, however stale the lane is', () => {
    const result = evaluateGap({ entries: [entry('a.json', hoursAgo(500))], now: NOW, freeze: 'true' });
    expect(result.status).toBe('frozen');
    expect(renderResult(result, { now: NOW }).exitCode).toBe(0);
    expect(renderResult(result, { now: NOW }).treeLine).toBeNull();
  });

  it('treats an explicitly-off freeze value as not frozen', () => {
    expect(isFrozen('')).toBe(false);
    expect(isFrozen(undefined)).toBe(false);
    expect(isFrozen('false')).toBe(false);
    expect(isFrozen('0')).toBe(false);
    expect(isFrozen('true')).toBe(true);
    expect(isFrozen('1')).toBe(true);
    expect(evaluateGap({ entries: [entry('a.json', hoursAgo(500))], now: NOW, freeze: 'false' }).status).toBe('gap');
  });

  it('reports unknown, never "clear", when no record carries a usable postedAt', () => {
    const result = evaluateGap({ entries: [], malformed: ['broken.json'], now: NOW });
    expect(result.status).toBe('unknown');
    expect(renderResult(result, { now: NOW }).exitCode).toBe(2);
  });

  it('reports unknown rather than trusting a far-future postedAt that would hide a gap', () => {
    const result = evaluateGap({
      entries: [entry('skewed.json', new Date(NOW.getTime() + 72 * 3_600_000).toISOString())],
      now: NOW,
    });
    expect(result.status).toBe('unknown');
    expect(result.reason).toContain('future');
  });

  it('clamps ordinary clock skew to zero age instead of alarming', () => {
    const result = evaluateGap({
      entries: [entry('skewed.json', new Date(NOW.getTime() + 60_000).toISOString())],
      now: NOW,
    });
    expect(result.status).toBe('ok');
    expect(result.hours).toBe(0);
  });

  it('skips one unreadable record but still measures the gap, and says so', () => {
    const { entries, malformed } = readPostedTimestamps(
      '/fake',
      fakeDir({
        'good.json': posted(hoursAgo(90)),
        'not-json.json': '{ this is not json',
        'no-postedat.json': JSON.stringify({ platform: 'x' }),
      }),
    );
    expect(entries).toHaveLength(1);
    expect(malformed.sort()).toEqual(['no-postedat.json', 'not-json.json']);
    const rendered = renderResult(evaluateGap({ entries, malformed, now: NOW }), { now: NOW });
    expect(rendered.exitCode).toBe(1);
    expect(rendered.body).toContain('2 record(s)');
  });

  it('ignores non-JSON files in the directory', () => {
    const { entries } = readPostedTimestamps(
      '/fake',
      fakeDir({ 'a.json': posted(hoursAgo(2)), 'README.md': '# notes' }),
    );
    expect(entries.map((e) => e.name)).toEqual(['a.json']);
  });

  it('reports unknown when the directory itself cannot be read', () => {
    const result = checkPostingGap({
      dir: '/fake',
      env: {},
      now: NOW,
      fs: {
        readDir: () => {
          throw new Error('ENOENT: no such directory');
        },
      },
    });
    expect(result.exitCode).toBe(2);
    expect(result.line).toContain('could not be read');
  });

  it('reads the freeze switch off the environment end to end', () => {
    const fs = fakeDir({ 'a.json': posted(hoursAgo(400)) });
    expect(checkPostingGap({ dir: '/fake', env: {}, now: NOW, fs }).exitCode).toBe(1);
    expect(checkPostingGap({ dir: '/fake', env: { SOCIAL_FREEZE: 'true' }, now: NOW, fs }).exitCode).toBe(0);
  });

  describe('#longlive-tree ping', () => {
    it('posts one line to the social channel with the alert url appended', async () => {
      const postImpl = vi.fn().mockResolvedValue({ ok: true });
      const outcome = await pingTree('⚠️ gap', {
        env: { DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.invalid/hook' },
        url: 'https://github.com/x/y/issues/1',
        postImpl,
      });
      expect(outcome).toBe('sent');
      expect(postImpl).toHaveBeenCalledTimes(1);
      const [text, options] = postImpl.mock.calls[0];
      expect(text).toBe('⚠️ gap\nWatchdog alert: https://github.com/x/y/issues/1');
      expect(options.webhook).toBe('https://discord.invalid/hook');
      expect(options.username).toBe('Watchdog');
    });

    it('is a clean no-op when no webhook is configured', async () => {
      const postImpl = vi.fn();
      expect(await pingTree('⚠️ gap', { env: {}, postImpl })).toBe('skipped');
      expect(postImpl).not.toHaveBeenCalled();
    });

    it('sends nothing when the verdict carries no line (a frozen lane)', async () => {
      const postImpl = vi.fn();
      expect(
        await pingTree(null, {
          env: { DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.invalid/hook' },
          postImpl,
        }),
      ).toBe('nothing-to-send');
      expect(postImpl).not.toHaveBeenCalled();
    });

    it('reports a failed delivery instead of throwing — the issue still carries the alarm', async () => {
      const postImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      expect(
        await pingTree('⚠️ gap', {
          env: { DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.invalid/hook' },
          postImpl,
        }),
      ).toBe('failed');
    });
  });
});
