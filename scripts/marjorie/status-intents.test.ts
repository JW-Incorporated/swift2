import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  STATUS_INTENT_CONFIDENCE,
  STATUS_INTENTS,
  buildStatusTemplate,
  classifyStatusIntent,
  handleStatusRequest,
  loadLiveStatus,
  main,
} from './status-intents.mjs';

const choice = (intent: string, confidence = 0.9) => ({
  ask: vi.fn(async () => ({
    answers: { intent: { type: 'choice', optionId: intent, confidence, probabilities: { [intent]: confidence } } },
  })),
});

const pr = (number: number, title: string) => ({
  number, title, url: `https://github.com/o/r/pull/${number}`, mergedAt: '2026-10-14T12:00:00Z',
});

const live = () => ({
  repo: 'o/r',
  issue: { number: 50, url: 'https://github.com/o/r/issues/50' },
  data: {
    warnings: [],
    plan: { number: 70, title: 'Week of October 12', url: 'https://github.com/o/r/issues/70', body: '## Next up\n- Restore routines\n- Ship fan work' },
    metricsLatest: { date: '2026-10-14', followers: { instagram: 10, x: 8, facebook: 12 } },
    metricsPrior: { date: '2026-10-07', followers: { instagram: 8, x: 8, facebook: 11 } },
    traffic: { v: 44, pv: 120 },
    posted: [{ platform: 'instagram', postedAt: '2026-10-14T00:00:00Z', url: 'https://example.com/post' }],
    draftPrs: [pr(14, 'Tree draft')],
    strategy: { bullets: ['- Reach fans where they already gather', '- Publish the strongest Vault moments'] },
  },
  view: {
    items: [
      { number: 124, title: 'Add the Jev key', tag: 'BLOCKING', anchor: '124-add-the-jev-key', filed: '2026-10-14' },
      { number: 125, title: 'Confirm the bot loops', tag: 'DECIDE', anchor: '125-confirm-the-bot-loops', filed: '2026-10-14' },
    ],
    shipped: [pr(90, 'Ship a fan-facing fix'), pr(89, 'Publish a Vault update')],
    inFlight: [pr(91, 'Restore routines')],
  },
});

describe('status intent classification', () => {
  it('keeps a fixed, explicit intent set and a named confidence threshold', () => {
    expect(STATUS_INTENTS.map((item: { id: string }) => item.id)).toEqual([
      'overview', 'needs_you', 'next_up', 'shipped', 'growth', 'tree', 'strategy', 'free_form',
    ]);
    expect(STATUS_INTENT_CONFIDENCE).toBe(0.72);
  });

  it('uses the Jev choice answer without deriving another score', async () => {
    const client = choice('growth', 0.81);
    await expect(classifyStatusIntent('How is growth?', client)).resolves.toEqual({ intent: 'growth', confidence: 0.81 });
    expect(client.ask).toHaveBeenCalledWith(expect.objectContaining({ caller: 'marjorie-status-intents' }));
  });

  it('falls back for free-form and below-threshold messages without reading live data', async () => {
    const loadStatus = vi.fn();
    await expect(handleStatusRequest({ text: 'Fix #12', issue_number: 50 }, { client: choice('free_form'), loadStatus, postComment: vi.fn() }))
      .resolves.toMatchObject({ handled: false, reason: 'free-form' });
    await expect(handleStatusRequest({ text: 'Maybe status?', issue_number: 50 }, { client: choice('overview', 0.71), loadStatus, postComment: vi.fn() }))
      .resolves.toMatchObject({ handled: false, reason: 'low-confidence' });
    expect(loadStatus).not.toHaveBeenCalled();
  });

  it('posts exactly one deterministic answer for a confident match', async () => {
    const postComment = vi.fn(async () => undefined);
    const result = await handleStatusRequest(
      { text: 'What needs me?', issue_number: 50 },
      { client: choice('needs_you'), loadStatus: vi.fn(async () => live()), postComment, log: vi.fn() },
    );
    expect(result).toMatchObject({ handled: true, intent: 'needs_you' });
    expect(postComment).toHaveBeenCalledOnce();
    expect(postComment.mock.calls[0][0]).toBe(50);
    expect(postComment.mock.calls[0][1]).toContain('#124 Add the Jev key');
  });
});

describe('status templates', () => {
  it.each([
    ['overview', ['2 items waiting on you', '2 changes shipped in 7 days', '1 PR in flight']],
    ['needs_you', ['#124 Add the Jev key', '#125 Confirm the bot loops']],
    ['next_up', ['Week of October 12', 'Restore routines', '1 non-draft PR']],
    ['shipped', ['2 changes', '#90 Ship a fan-facing fix']],
    ['growth', ['Instagram 10 (+2)', '44 visitors', '120 pageviews']],
    ['tree', ['1 post published in 7 days', '1 draft awaiting approval']],
    ['strategy', ['Reach fans where they already gather', 'living strategy']],
  ])('renders %s from supplied live facts', (intent, expected) => {
    const body = buildStatusTemplate(intent, live());
    for (const text of expected) expect(body).toContain(text);
    expect(body!.length).toBeLessThanOrEqual(1500);
  });

  it('refuses to turn an unreadable required source into a false zero', () => {
    const current = live();
    const unavailable = { ...current, data: { ...current.data, warnings: ['merged PRs'] } };
    expect(buildStatusTemplate('shipped', unavailable)).toBeNull();
  });
});

describe('status-intents CLI fail-open behavior', () => {
  it('falls back when the key is absent, without constructing a client', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'status-intents-'));
    try {
      const output = path.join(dir, 'output');
      writeFileSync(output, '');
      const clientFactory = vi.fn();
      await main([path.join(dir, 'missing.json')], { env: { GITHUB_OUTPUT: output }, clientFactory, log: vi.fn() });
      expect(readFileSync(output, 'utf8')).toBe('handled=false\n');
      expect(clientFactory).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back on Jev errors and records usage only in the step summary on success', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'status-intents-'));
    try {
      const context = path.join(dir, 'context.json');
      const output = path.join(dir, 'output');
      const summary = path.join(dir, 'summary');
      writeFileSync(context, JSON.stringify({ text: 'What shipped?', issue_number: 50 }));
      writeFileSync(output, '');
      writeFileSync(summary, '');
      await main([context], {
        env: { TYPESAFE_API_KEY: 'fixture-secret', GITHUB_OUTPUT: output },
        clientFactory: () => ({ ask: async () => { throw new Error('timeout'); } }), log: vi.fn(),
      });
      expect(readFileSync(output, 'utf8')).toBe('handled=false\n');

      writeFileSync(output, '');
      const gh = vi.fn(async () => undefined);
      await main([context], {
        env: { TYPESAFE_API_KEY: 'fixture-secret', GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary, GITHUB_REPOSITORY: 'o/r' },
        clientFactory: (options: { logUsage: (usage: object) => void }) => ({
          ask: async () => {
            options.logUsage({ caller: 'marjorie-status-intents', inputTokens: 20, outputTokens: 3, estCostUsd: 0.000001, model: 'jev-1.13.0' });
            return { answers: { intent: { type: 'choice', optionId: 'shipped', confidence: 0.9, probabilities: {} } } };
          },
        }),
        loadStatus: vi.fn(async () => live()), gh, log: vi.fn(),
      });
      expect(readFileSync(output, 'utf8')).toBe('handled=true\n');
      expect(readFileSync(summary, 'utf8')).toContain('input 20 · output 3');
      expect(readFileSync(summary, 'utf8')).not.toContain('fixture-secret');
      expect(gh).toHaveBeenCalledOnce();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// The GitHub status-comment path has not received a free-form request yet. Its
// predecessor deleted raw Discord inputs after each run; only public summaries
// remain. This fixed proxy covers the seven status questions those summaries
// and the permanent page expose. Run explicitly with LIVE_JEV_REPLAY=1.
const REPLAY: [string, string][] = [
  ['How are things overall?', 'overview'], ['Give me the current status.', 'overview'],
  ['Is the project healthy right now?', 'overview'], ['What is going on with the project?', 'overview'],
  ['What needs me?', 'needs_you'], ['What is blocked on me?', 'needs_you'],
  ['Do I have decisions to make?', 'needs_you'], ['What is waiting on the owner?', 'needs_you'],
  ['What do you need from me today?', 'needs_you'], ['What are the top priorities?', 'next_up'],
  ['What is next?', 'next_up'], ['Show me the weekly plan.', 'next_up'],
  ['What work is in flight?', 'next_up'], ['What are we working on now?', 'next_up'],
  ['What shipped this week?', 'shipped'], ['What changed recently?', 'shipped'],
  ['What did we finish?', 'shipped'], ['Show me the latest shipped work.', 'shipped'],
  ['How is growth?', 'growth'], ['Are we growing?', 'growth'],
  ['What are traffic and followers doing?', 'growth'], ['Is the growth plan working?', 'growth'],
  ['How many posts went live?', 'tree'], ['Does Tree have drafts waiting?', 'tree'],
  ['What is happening with social?', 'tree'], ['How are we growing the site?', 'strategy'],
  ['What is the growth strategy?', 'strategy'], ['What is our plan to reach fans?', 'strategy'],
  ['Why are these the current growth bets?', 'strategy'], ['What channels are in the strategy?', 'strategy'],
];

const liveReplay = process.env.LIVE_JEV_REPLAY === '1' ? it : it.skip;
liveReplay('replays 30 status questions through live Jev and current live data', async () => {
  const client = (await import('../lib/jev.mjs')).createJevClient();
  const status = await loadLiveStatus();
  let templated = 0;
  let correct = 0;
  for (const [text, expected] of REPLAY) {
    const match = await classifyStatusIntent(text, client);
    const body = match.confidence >= STATUS_INTENT_CONFIDENCE && match.intent !== 'free_form'
      ? buildStatusTemplate(match.intent, status)
      : null;
    if (body) templated += 1;
    if (body && match.intent === expected) correct += 1;
  }
  console.log(`status replay: ${templated}/30 templated; ${correct}/30 correct`);
  expect(templated).toBeGreaterThanOrEqual(24);
  expect(correct).toBeGreaterThanOrEqual(24);
}, 120_000);
