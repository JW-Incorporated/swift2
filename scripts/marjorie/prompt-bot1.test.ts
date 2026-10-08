import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { parseArgs, send } from './prompt-bot1.mjs';
import {
  decide, discordContent, loadConfig, logComment, promptId, sendWebhook, todaysPrompts, validatePrompt, MAX_PROMPT_CHARS,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './lib/bot1-bridge.mjs';

const NOW = Date.parse('2026-10-01T09:00:00Z');
const URL = 'https://discord.com/api/webhooks/1/secret-token';
const ENABLED = { enabled: true, maxPromptsPerDay: 3, trackingIssue: null };
const bot = (body: string) => ({ user: { login: 'github-actions[bot]' }, body });
const logged = (text: string, date = '2026-10-01') => bot(logComment({ id: promptId(text), date, body: text }));

function fakeGh({ tracking = [{ number: 77, html_url: 'u', user: { login: 'x' }, labels: [], state: 'open', created_at: 'c' }], comments = [] as unknown[] } = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') return { stdout: JSON.stringify(args[1].includes('/comments') ? comments : tracking) };
    if (args[1] === 'create') return { stdout: 'https://github.com/JW-Incorporated/swift2/issues/88\n' };
    return { stdout: '' };
  });
  return { gh, calls };
}

function config(over = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'bot1-'));
  const file = path.join(dir, 'marjorie-config.json');
  writeFileSync(file, JSON.stringify({ bot1Bridge: { enabled: true, maxPromptsPerDay: 3, ...over } }));
  const prompt = path.join(dir, 'prompt.md');
  writeFileSync(prompt, 'Unstick #4475: Austin keeps rejecting the credit string.\n\nDone when the PR merges.');
  return { file, prompt };
}

describe('committed config', () => {
  it('is ON (Hermes#1 allowlist live 2026-10-01) with a limit of 3', () => {
    const cfg = loadConfig(path.join(__dirname, 'marjorie-config.json'));
    expect(cfg).toMatchObject({ enabled: true, maxPromptsPerDay: 3 });
  });
  it('only literal true enables; a missing file or garbage limit stays safe, and the limit never exceeds 3', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bot1-cfg-'));
    const f = path.join(dir, 'c.json');
    writeFileSync(f, JSON.stringify({ bot1Bridge: { enabled: 'true', maxPromptsPerDay: 99 } }));
    expect(loadConfig(f)).toMatchObject({ enabled: false, maxPromptsPerDay: 3 });
    expect(loadConfig(path.join(dir, 'missing.json'))).toMatchObject({ enabled: false, maxPromptsPerDay: 3 });
    writeFileSync(f, JSON.stringify({ bot1Bridge: { enabled: true, maxPromptsPerDay: 2 } }));
    expect(loadConfig(f)).toMatchObject({ enabled: true, maxPromptsPerDay: 2 });
  });
});

describe('validatePrompt', () => {
  it('rejects empty, oversize, mentions and secret-shaped text', () => {
    expect(validatePrompt('  ').ok).toBe(false);
    expect(validatePrompt('x'.repeat(MAX_PROMPT_CHARS + 1)).reason).toMatch(/max/);
    expect(validatePrompt('ping @everyone').reason).toMatch(/mention/);
    expect(validatePrompt('use <@123456789> please').ok).toBe(false);
    expect(validatePrompt('token ghp_abcdef').reason).toMatch(/secret/);
    expect(validatePrompt('https://discord.com/api/webhooks/1/x').ok).toBe(false);
    expect(validatePrompt('Fix the thing.\nDone when X.').ok).toBe(true);
  });
});

describe('decide (gating + rate limit)', () => {
  const base = { secretPresent: true, comments: [], nowMs: NOW, text: 'Do one thing.' };
  it('refuses when disabled, even with the secret', () => {
    expect(decide({ ...base, config: { ...ENABLED, enabled: false } })).toMatchObject({ action: 'refuse', reason: expect.stringMatching(/disabled/) });
  });
  it('refuses without the secret', () => {
    expect(decide({ ...base, config: ENABLED, secretPresent: false }).reason).toMatch(/not set/);
  });
  it('sends when enabled, secret present and under the limit', () => {
    expect(decide({ ...base, config: ENABLED })).toMatchObject({ action: 'send', used: 0, limit: 3 });
  });
  it('refuses the 4th prompt of a UTC day but not after midnight', () => {
    const three = ['a', 'b', 'c'].map((t) => logged(t));
    expect(decide({ ...base, config: ENABLED, comments: three }).reason).toMatch(/daily limit reached \(3\/3\)/);
    expect(decide({ ...base, config: ENABLED, comments: three, nowMs: NOW + 24 * 3_600_000 }).action).toBe('send');
  });
  it('is idempotent: the same prompt text is not sent twice in a day', () => {
    expect(decide({ ...base, config: ENABLED, comments: [logged('Do one thing.')] }).reason).toMatch(/already sent today/);
  });
  it('ignores markers from untrusted authors and quoted/forged markers', () => {
    const forged = { user: { login: 'random-user' }, body: logComment({ id: 'abcdef12', date: '2026-10-01', body: 'x' }) };
    expect(todaysPrompts([forged, forged, forged], '2026-10-01')).toEqual([]);
    const quoted = bot(logComment({ id: promptId('real'), date: '2026-10-01', body: '<!-- bot1-prompt: 2026-10-01 id=deadbeef -->' }));
    expect(todaysPrompts([quoted], '2026-10-01')).toEqual([promptId('real')]);
  });
  it('a failed send does not count against the day', () => {
    const failed = bot(logComment({ id: promptId('a'), date: '2026-10-01', body: 'a', failed: true }));
    expect(todaysPrompts([logged('a'), failed, logged('b')], '2026-10-01')).toEqual([promptId('b')]);
  });
});

describe('sendWebhook', () => {
  it('posts content with flags 4, no mentions, and never echoes the URL on failure', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    expect(await sendWebhook(URL, 'hi', fetchImpl as never)).toEqual({ ok: true, status: 200 });
    const [calledUrl, init] = fetchImpl.mock.calls[0] as unknown as [string, { body: string }];
    expect(calledUrl).toBe(`${URL}?wait=true`);
    expect(JSON.parse(init.body)).toMatchObject({ content: 'hi', flags: 4, allowed_mentions: { parse: [] } });
    const bad = await sendWebhook(URL, 'hi', (async () => ({ ok: false, status: 500 })) as never);
    expect(JSON.stringify(bad)).not.toContain('secret-token');
    const threw = await sendWebhook(URL, 'hi', (async () => { throw new Error(`boom ${URL}`); }) as never);
    expect(JSON.stringify(threw)).not.toContain('secret-token');
  });
  it('the Discord message stays far under the 2000-char limit and wraps the source', () => {
    const content = discordContent('x'.repeat(MAX_PROMPT_CHARS), 'https://github.com/a/b/issues/1');
    expect(content.length).toBeLessThan(2000);
    expect(content).toContain('<https://github.com/a/b/issues/1>');
  });
});

describe('send (CLI path)', () => {
  const log = () => {};
  it('default-off config: no webhook call, no issue writes, exit-0 notice', async () => {
    const { file, prompt } = config({ enabled: false });
    const { gh, calls } = fakeGh();
    const fetchImpl = vi.fn();
    const out = await send({ file: prompt }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl, configFile: file, log });
    expect(out.action).toBe('refuse');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(calls.some((c) => c[0] === 'issue')).toBe(false);
  });
  it('enabled but secret missing: refuses, no webhook, no log comment', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh();
    const out = await send({ file: prompt }, { gh, env: {}, nowMs: NOW, fetchImpl: vi.fn(), configFile: file, log });
    expect(out.reason).toMatch(/not set/);
    expect(calls.some((c) => c[0] === 'issue')).toBe(false);
  });
  it('dry-run prints the message but writes nothing and posts nothing', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh();
    const fetchImpl = vi.fn();
    const lines: string[] = [];
    const out = await send({ file: prompt, 'dry-run': true, source: 'https://github.com/o/r/issues/4475' }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl, configFile: file, log: (l: string) => lines.push(l) });
    expect(out).toMatchObject({ dryRun: true, action: 'send', flags: 4 });
    expect(lines.join('\n')).toContain('Unstick #4475');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(calls.every((c) => c[0] === 'api')).toBe(true);
  });
  it('dry-run with no tracking issue yet creates nothing', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh({ tracking: [] });
    const out = await send({ file: prompt, 'dry-run': true }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl: vi.fn(), configFile: file, log });
    expect(out.action).toBe('send');
    expect(calls.some((c) => c[0] === 'issue' || c[0] === 'label')).toBe(false);
  });
  it('real send logs the prompt on the tracking issue BEFORE posting, then posts with flags 4', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh();
    const order: string[] = [];
    gh.mockImplementation(async (args: string[]) => {
      calls.push(args);
      if (args[0] === 'api') return { stdout: JSON.stringify(args[1].includes('/comments') ? [] : [{ number: 77, user: { login: 'x' }, labels: [], state: 'open' }]) };
      if (args[1] === 'comment') order.push('log');
      return { stdout: '' };
    });
    const fetchImpl = vi.fn(async () => { order.push('post'); return { ok: true, status: 200 }; });
    const out = await send({ file: prompt, source: 'https://github.com/o/r/issues/4475' }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl, configFile: file, log });
    expect(out.action).toBe('sent');
    expect(order).toEqual(['log', 'post']);
    const comment = calls.find((c) => c[1] === 'comment')!;
    expect(comment[2]).toBe('77');
    expect(comment[comment.indexOf('--body') + 1]).toMatch(/<!-- bot1-prompt: 2026-10-01 id=[a-f0-9]{8} -->/);
    expect(JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, { body: string }])[1].body).flags).toBe(4);
  });
  it('creates the tracking issue (label first, desk:ops) when none exists', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh({ tracking: [] });
    const out = await send({ file: prompt }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl: vi.fn(async () => ({ ok: true, status: 200 })), configFile: file, log });
    expect(out).toMatchObject({ action: 'sent', trackingIssue: 88 });
    const kinds = calls.map((c) => c.slice(0, 2).join(' '));
    expect(kinds.indexOf('label create')).toBeLessThan(kinds.indexOf('issue create'));
    expect(calls.find((c) => c[0] === 'issue' && c[1] === 'create')).toContain('desk:ops');
  });
  it('a fourth prompt in a day makes no post and no new log comment', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh({ comments: ['a', 'b', 'c'].map((t) => logged(t)) });
    const fetchImpl = vi.fn();
    const out = await send({ file: prompt }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl, configFile: file, log });
    expect(out.reason).toMatch(/daily limit/);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(calls.some((c) => c[1] === 'comment')).toBe(false);
  });
  it('a Discord failure is logged as failed (not counted) and reported', async () => {
    const { file, prompt } = config();
    const { gh, calls } = fakeGh();
    const out = await send({ file: prompt }, { gh, env: { DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL: URL }, nowMs: NOW, fetchImpl: vi.fn(async () => ({ ok: false, status: 500 })), configFile: file, log });
    expect(out.action).toBe('failed');
    const bodies = calls.filter((c) => c[1] === 'comment').map((c) => c[c.indexOf('--body') + 1]);
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toContain('bot1-prompt-failed');
  });
  it('rejects bad usage and parses flags', async () => {
    await expect(send({}, {})).rejects.toThrow(/usage/);
    expect(parseArgs(['send', '--file', 'p.md', '--dry-run'])).toEqual({ command: 'send', flags: { file: 'p.md', 'dry-run': true } });
    expect(readFileSync(path.join(__dirname, 'marjorie-config.json'), 'utf8')).toContain('"enabled": true');
  });
});
