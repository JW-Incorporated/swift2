import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISPATCH_TIMEOUT_MS, NOTICE_TIMEOUT_MS, STAGES, alarmBody, alarmTitle, alert, check } from './chat-alarm.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { runTitle } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API, snowflakeMs } from './lib/discord-bot.mjs';

const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const MID = '1548716528432713729';
const POSTED = snowflakeMs(MID);
const NOW = POSTED + 7 * 60_000;
const FOUNDER_TEXT = 'please do not quote me in public';
const RUN = 'https://github.com/JW-Incorporated/swift2/actions/runs/9';

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function discord(message: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const routes: Record<string, unknown> = {
    [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages/${MID}`]: res(200, message),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages?after=${MID}&limit=100`]: res(200, []),
    [`GET ${DISCORD_API}/channels/${MID}/messages?after=${MID}&limit=100`]: res(404, {}),
    ...extra,
  };
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    calls.push(key);
    return key in routes ? routes[key] : res(404, {});
  });
  return { fetchImpl, calls };
}
const founderMessage = (over: Record<string, unknown> = {}) => ({ id: MID, type: 0, author: { id: '338508192755482626' }, content: FOUNDER_TEXT, ...over });
const gh = (runs: unknown[] | Error) => vi.fn(() => {
  if (runs instanceof Error) throw runs;
  return JSON.stringify(runs);
});

async function run(stage: string, { message = founderMessage(), runs = [] as unknown[] | Error, extra = {} } = {}) {
  const outFile = join(mkdtempSync(join(tmpdir(), 'chat-alarm-')), 'out');
  writeFileSync(outFile, '');
  const { fetchImpl, calls } = discord(message, extra);
  const logged: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((line: string) => { logged.push(String(line)); });
  const env = { STAGE: stage, BOT: 'marjorie', MESSAGE_ID: MID, CHANNEL_ID: MARJ, THREAD_ID: '', DISCORD_BOT_TOKEN: 'bot', REPO: 'JW-Incorporated/swift2', GITHUB_OUTPUT: outFile, RUN_URL: RUN };
  const code = await check({ env, fetchImpl, sleepImpl: vi.fn().mockResolvedValue(undefined), execImpl: gh(runs), now: NOW });
  spy.mockRestore();
  const text = readFileSync(outFile, 'utf8');
  const outputs: Record<string, string> = {};
  for (const m of text.matchAll(/^(\w+)<<(\S+)\n([\s\S]*?)\n\2$/gm)) outputs[m[1]] = m[3];
  for (const m of text.matchAll(/^(\w+)=(.*)$/gm)) outputs[m[1]] = m[2];
  return { code, outputs, raw: text, logged: logged.join('\n'), calls };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('check: clock-silent', () => {
  const clockRun = (minutesAgo: number) => ({
    event: 'workflow_dispatch', created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
    html_url: `https://github.com/run/${minutesAgo}`, triggering_actor: { type: 'User' },
  });
  async function clock(runs: unknown[]) {
    const outFile = join(mkdtempSync(join(tmpdir(), 'chat-alarm-')), 'out');
    writeFileSync(outFile, '');
    const fetchImpl = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const execImpl = vi.fn(() => JSON.stringify({ workflow_runs: runs }));
    const code = await check({ env: { STAGE: 'clock-silent', REPO: 'JW-Incorporated/swift2', GITHUB_OUTPUT: outFile, RUN_URL: RUN }, fetchImpl, execImpl, now: NOW });
    const text = readFileSync(outFile, 'utf8');
    const outputs: Record<string, string> = {};
    for (const m of text.matchAll(/^(\w+)<<(\S+)\n([\s\S]*?)\n\2$/gm)) outputs[m[1]] = m[3];
    for (const m of text.matchAll(/^(\w+)=(.*)$/gm)) outputs[m[1]] = m[2];
    return { code, outputs, fetchImpl };
  }

  it('opens the standing alert when the newest clock-started poll run is over 20 minutes old, with no message and no Discord read', async () => {
    const { code, outputs, fetchImpl } = await clock([clockRun(35)]);
    expect(code).toBe(0);
    expect(outputs).toMatchObject({ alert: 'true', title: 'Clock is not firing', dispatch_poll: 'false' });
    expect(outputs.body).toContain('https://github.com/run/35');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('ends with no alert once the clock has started the poll again', async () => {
    expect((await clock([clockRun(3)])).outputs).toEqual({ alert: 'false' });
  });
});

describe('alarm titles', () => {
  it('a stuck reply gets its own issue; a doorbell fault is one standing issue', () => {
    expect(STAGES).toEqual(['stuck', 'doorbell-missed', 'doorbell-dispatch-failed', 'clock-silent']);
    expect(alarmTitle('clock-silent', '', '')).toBe('Clock is not firing');
    expect(alarmTitle('stuck', 'tree', MID)).toBe(`Chat reply stuck · Tree · ${MID}`);
    expect(alarmTitle('doorbell-missed', 'marjorie', MID)).toBe('Doorbell is not answering');
    expect(alarmTitle('doorbell-dispatch-failed', 'tree', MID)).toBe('Doorbell dispatch is failing');
  });
});

describe('check', () => {
  it('stuck, but a ✅ is there now: ends with no alert', async () => {
    const { code, outputs } = await run('stuck', { message: founderMessage({ reactions: [{ me: true, emoji: { name: '✅' } }] }) });
    expect(code).toBe(0);
    expect(outputs).toEqual({ alert: 'false' });
  });

  it('stuck, but a reply is already in the thread: ends with no alert', async () => {
    const reply = { id: '1548716528432713999', webhook_id: '5', author: { username: 'Marjorie' }, content: 'answer' };
    const { outputs } = await run('stuck', { extra: { [`GET ${DISCORD_API}/channels/${MID}/messages?after=${MID}&limit=100`]: res(200, [reply]) } });
    expect(outputs.alert).toBe('false');
  });

  it('stuck with no run at all: alert, and the poll is started too', async () => {
    const { outputs, raw, logged } = await run('stuck');
    expect(outputs.alert).toBe('true');
    expect(outputs.title).toBe(`Chat reply stuck · Marjorie · ${MID}`);
    expect(outputs.dispatch_poll).toBe('true');
    expect(outputs.body).toContain(`https://discord.com/channels/${GUILD}/${MARJ}/${MID}`);
    expect(outputs.body).toContain(`none named \`${runTitle('marjorie', MID)}\``);
    expect(outputs.body).toContain('7 min');
    expect(outputs.body).toContain(`raised by: ${RUN}`);
    expect(`${raw}\n${logged}`).not.toContain(FOUNDER_TEXT);
  });

  it('stuck with a run still going: alert with the run and its state, no poll start', async () => {
    const good = 'https://github.com/JW-Incorporated/swift2/actions/runs/1';
    const { outputs } = await run('stuck', { runs: [{ displayTitle: runTitle('marjorie', MID), status: 'in_progress', url: good }] });
    expect(outputs.dispatch_poll).toBe('false');
    expect(outputs.body).toContain(`${good} (in_progress)`);
    // Anything off the expected shape never reaches the body (CodeQL js/http-to-file-access).
    const odd = await run('stuck', { runs: [{ displayTitle: runTitle('marjorie', MID), status: 'queued\nEOF', url: 'https://evil.example/x' }] });
    expect(odd.outputs.body).toContain('chat run: (no url) ()');
  });

  it('stuck and Discord unreadable: alerts anyway and says so', async () => {
    const { outputs } = await run('stuck', { extra: { [`GET ${DISCORD_API}/channels/${MARJ}/messages/${MID}`]: res(403, {}) } });
    expect(outputs.alert).toBe('true');
    expect(outputs.body).toContain('Discord now: unreadable');
  });

  it.each(['doorbell-missed', 'doorbell-dispatch-failed'])('%s: the standing alert, with no Discord message read', async (stage) => {
    const { outputs, calls, raw } = await run(stage, { runs: new Error('gh down') });
    expect(outputs.alert).toBe('true');
    expect(outputs.dispatch_poll).toBe('false');
    expect(outputs.body).toContain('chat run: could not be listed');
    expect(calls).toEqual([`GET ${DISCORD_API}/channels/${MARJ}`]);
    expect(raw).not.toContain(FOUNDER_TEXT);
  });

  it('refuses bad input', async () => {
    const { fetchImpl } = discord(founderMessage());
    for (const env of [{ STAGE: 'nope', BOT: 'marjorie', MESSAGE_ID: MID, CHANNEL_ID: MARJ }, { STAGE: 'stuck', BOT: 'x', MESSAGE_ID: MID, CHANNEL_ID: MARJ }, { STAGE: 'stuck', BOT: 'tree', MESSAGE_ID: '../1', CHANNEL_ID: MARJ }]) {
      expect(await check({ env, fetchImpl, execImpl: gh([]), now: NOW })).toBe(2);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('alert', () => {
  const env = (over: Record<string, string> = {}) => ({
    TITLE: 'Doorbell is not answering', BODY: 'line one\nline two', REPO: 'JW-Incorporated/swift2', RUNNER_TEMP: mkdtempSync(join(tmpdir(), 'chat-alarm-')), ...over,
  });
  function exec(fails: (cmd: string, args: string[]) => boolean = () => false) {
    const seen: string[] = [];
    const execImpl = vi.fn((cmd: string, args: string[], ...rest: unknown[]) => {
      void rest;
      seen.push(`${cmd} ${args.slice(0, 3).join(' ')}`);
      if (fails(cmd, args)) throw new Error('boom');
      return '';
    });
    return { seen, execImpl };
  }
  const OPEN = 'bash scripts/watchdog/upsert-alert.sh open Doorbell is not answering';
  const OPS = 'gh workflow run routine-marjorie-ops.yml';
  const POLL = 'gh workflow run bot-chat-poll.yml';

  it("opens the alert with the body, then starts Marjorie's ops routine; the poll only when asked", () => {
    const quiet = vi.spyOn(console, 'log').mockImplementation(() => {});
    const e = env();
    const first = exec();
    expect(alert({ env: e, execImpl: first.execImpl })).toBe(0);
    expect(first.seen).toEqual([OPEN, OPS]);
    const bodyFile = first.execImpl.mock.calls[0][1][3];
    expect(bodyFile.startsWith(join(e.RUNNER_TEMP, 'chat-alarm-'))).toBe(true); // a fresh private directory (CodeQL js/insecure-temporary-file)
    expect(readFileSync(bodyFile, 'utf8')).toBe('line one\nline two\n');
    const second = exec();
    expect(alert({ env: env({ DISPATCH_POLL: 'true' }), execImpl: second.execImpl })).toBe(0);
    expect(second.seen).toEqual([OPEN, OPS, POLL]);
    // A stalled notice is killed in time for both dispatches (Codex R2).
    expect(second.execImpl.mock.calls.map((call) => (call[2] as { timeout?: number } | undefined)?.timeout)).toEqual([NOTICE_TIMEOUT_MS, DISPATCH_TIMEOUT_MS, DISPATCH_TIMEOUT_MS]);
    expect(NOTICE_TIMEOUT_MS + 2 * DISPATCH_TIMEOUT_MS).toBeLessThan(8 * 60_000);
    expect((second.execImpl.mock.calls[0][2] as { stdio?: string }).stdio).toBe('ignore');
    quiet.mockRestore();
  });

  it('a failed notice still starts both routines, and fails the step (Codex R1 #2)', () => {
    const quiet = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { seen, execImpl } = exec((cmd) => cmd === 'bash');
    expect(alert({ env: env({ DISPATCH_POLL: 'true' }), execImpl })).toBe(1);
    expect(seen).toEqual([OPEN, OPS, POLL]);
    const ops = exec((_cmd, args) => args[2] === 'routine-marjorie-ops.yml');
    expect(alert({ env: env({ DISPATCH_POLL: 'true' }), execImpl: ops.execImpl })).toBe(1);
    expect(ops.seen).toEqual([OPEN, OPS, POLL]);
    quiet.mockRestore();
  });

  it('refuses to run without a title, body and repo', () => {
    const quiet = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { execImpl } = exec();
    expect(alert({ env: env({ TITLE: '' }), execImpl })).toBe(2);
    expect(execImpl).not.toHaveBeenCalled();
    quiet.mockRestore();
  });
});

describe('alarmBody', () => {
  it('never carries message text, for every stage', () => {
    for (const stage of STAGES.filter((s: string) => s !== 'clock-silent')) {
      const body = alarmBody({ stage, bot: 'tree', messageId: MID, channelId: MARJ, threadId: '900000000000000030', runs: [], posted: POSTED, now: NOW });
      expect(body).toContain(`thread \`900000000000000030\``);
      expect(body).not.toContain(FOUNDER_TEXT);
    }
  });
});
