import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  decideOutcome,
  dedupeWeeklyLimitIssues,
  failureHint,
  resultDetail,
  sessionLimitInfo,
  weeklyLimitInfo,
  weeklyLimitIssueBody,
  weeklyLimitIssueUpdate,
} from './session-outcome.mjs';

const log = (result: object) => JSON.stringify([{ type: 'system' }, { type: 'result', ...result }]);

describe('decideOutcome', () => {
  it('passes with a warning when a successful session exceeded the cap', () => {
    const r = decideOutcome(log({ subtype: 'success', is_error: false, num_turns: 42 }), {
      maxTurns: '40',
      stepOutcome: 'failure',
    });
    expect(r.pass).toBe(true);
    expect(r.message).toContain('42 turns (cap 40)');
  });

  it('fails when the action failed on a clean success result that was not over the cap', () => {
    const l = log({ subtype: 'success', is_error: false, num_turns: 40 });
    expect(decideOutcome(l, { maxTurns: '40', stepOutcome: 'failure' }).pass).toBe(false);
    expect(decideOutcome(l, { maxTurns: '50', stepOutcome: 'failure' }).pass).toBe(false);
    expect(decideOutcome(l, { stepOutcome: 'failure' }).pass).toBe(false);
  });

  it('fails on a genuine turn cutoff', () => {
    const r = decideOutcome(log({ subtype: 'error_max_turns', is_error: false, num_turns: 40 }), {
      stepOutcome: 'failure',
    });
    expect(r.pass).toBe(false);
  });

  it('fails when is_error is true even with subtype success', () => {
    expect(
      decideOutcome(log({ subtype: 'success', is_error: true }), { stepOutcome: 'failure' }).pass,
    ).toBe(false);
  });

  it('fails on error_during_execution', () => {
    expect(
      decideOutcome(log({ subtype: 'error_during_execution', is_error: true }), {
        stepOutcome: 'failure',
      }).pass,
    ).toBe(false);
  });

  it('fails when the execution file is missing, invalid, or has no result', () => {
    expect(decideOutcome(null, { stepOutcome: 'failure' }).pass).toBe(false);
    expect(decideOutcome('not json', { stepOutcome: 'failure' }).pass).toBe(false);
    expect(decideOutcome('[{"type":"system"}]', { stepOutcome: 'failure' }).pass).toBe(false);
  });

  it('passes silently when the action itself succeeded', () => {
    expect(decideOutcome(null, { stepOutcome: 'success' })).toEqual({ pass: true, message: null });
  });

  // Issue #5281: six identical routine failures logged only `is_error=true`.
  it('names the reason the session reported instead of only the result flags', () => {
    const r = decideOutcome(
      log({ subtype: 'success', is_error: true, result: 'Prompt is too long' }),
      {
        stepOutcome: 'failure',
      },
    );
    expect(r.pass).toBe(false);
    expect(r.message).toContain('reason: Prompt is too long');
  });

  it('calls out an exhausted plan-usage window as transient, with its reset time', () => {
    const r = decideOutcome(
      log({
        subtype: 'success',
        is_error: true,
        num_turns: 1,
        total_cost_usd: 0,
        modelUsage: {},
        result: 'Claude AI usage limit reached|1760000400',
      }),
      { stepOutcome: 'failure' },
    );
    expect(r.pass).toBe(false);
    expect(r.message).toContain('plan usage for this account is exhausted');
    expect(r.message).toContain('resets 2025-10-09T09:00:00.000Z');
    expect(r.message).toContain('not a code defect');
  });

  it('flags a zero-turn, zero-cost failure as pre-first-call when the session said nothing', () => {
    const r = decideOutcome(
      log({ subtype: 'success', is_error: true, num_turns: 1, total_cost_usd: 0, modelUsage: {} }),
      {
        stepOutcome: 'failure',
      },
    );
    expect(r.message).toContain('before its first API call');
  });

  it('leaves a mid-session failure without a transient hint', () => {
    const r = decideOutcome(
      log({
        subtype: 'error_during_execution',
        is_error: true,
        num_turns: 12,
        total_cost_usd: 0.4,
        modelUsage: { a: 1 },
      }),
      { stepOutcome: 'failure' },
    );
    expect(r.message).not.toContain('not a code defect');
    expect(r.message).not.toContain('before its first API call');
  });
});

describe('resultDetail', () => {
  it('reads the reason from result, error, or error.message', () => {
    expect(resultDetail({ result: 'boom' })).toBe('boom');
    expect(resultDetail({ error: 'boom' })).toBe('boom');
    expect(resultDetail({ error: { message: 'boom' } })).toBe('boom');
    expect(resultDetail({})).toBeNull();
    expect(resultDetail({ result: '   ' })).toBeNull();
  });

  it('collapses newlines so the reason stays one annotation line', () => {
    expect(resultDetail({ result: 'line one\n\nline two' })).toBe('line one line two');
  });

  it('redacts token-shaped substrings before they reach a public log', () => {
    const d = resultDetail({
      result: 'auth failed for sk-ant-abc123DEF456ghi789 and ghp_AAAAAAAAAAAAAAAAAAAA',
    });
    expect(d).not.toContain('sk-ant-abc123DEF456ghi789');
    expect(d).not.toContain('ghp_AAAAAAAAAAAAAAAAAAAA');
    expect(d).toContain('[redacted]');
  });

  it('truncates a long reason', () => {
    const d = resultDetail({ result: 'the model refused. '.repeat(40) }) as string;
    expect(d.length).toBeLessThanOrEqual(241);
    expect(d.endsWith('…')).toBe(true);
  });
});

describe('failureHint', () => {
  it('handles a usage-limit reason with no timestamp', () => {
    expect(failureHint({ result: 'Claude AI usage limit reached' })).toContain(
      'plan usage for this account is exhausted',
    );
    expect(failureHint({ result: 'Claude AI usage limit reached' })).not.toContain('resets');
  });

  it('accepts a millisecond reset stamp as well as a second one', () => {
    expect(failureHint({ result: 'Claude AI usage limit reached|1760000400000' })).toContain(
      'resets 2025-10-09T09:00:00.000Z',
    );
  });
});

// Issue #5900: routine-marjorie-ask-response failed three times on 2026-10-15
// because only the WEEKLY wording was treated as a limit; the five-hour session
// window fell through to the generic failure branch and the run went red.
describe('session limit outcome', () => {
  const realLimitText = "You've hit your session limit · resets 6:30pm (UTC)";

  it('passes with a warning for the exact production log text and extracts its reset', () => {
    const r = decideOutcome(log({ subtype: 'success', is_error: true, result: realLimitText }), {
      stepOutcome: 'failure',
      now: new Date('2026-10-15T17:42:37.000Z'),
    });
    expect(r.pass).toBe(true);
    expect(r.message).toContain('five-hour session window');
    expect(r.message).toContain('resets 2026-10-15T18:30:00.000Z');
    expect(r.sessionLimit).toEqual({
      detectedAt: '2026-10-15T17:42:37.000Z',
      resetAt: '2026-10-15T18:30:00.000Z',
      parsed: true,
    });
  });

  it('never writes the fleet-wide weekly-limit tracking issue', () => {
    const r = decideOutcome(log({ subtype: 'success', is_error: true, result: realLimitText }), {
      stepOutcome: 'failure',
      now: new Date('2026-10-15T17:42:37.000Z'),
    });
    expect(r.weeklyLimit).toBeUndefined();
    expect(weeklyLimitInfo({ result: realLimitText })).toBeNull();
  });

  it('bounds a session limit with no reset clause to five hours', () => {
    expect(
      sessionLimitInfo(
        { result: 'hit your session limit' },
        { now: new Date('2026-10-15T17:00:00.000Z') },
      ),
    ).toEqual({
      detectedAt: '2026-10-15T17:00:00.000Z',
      resetAt: '2026-10-15T22:00:00.000Z',
      parsed: false,
    });
  });

  it('keeps the limit prefix the failure-triage and claude-call classifiers match on', () => {
    expect(
      failureHint({ result: realLimitText }, { now: new Date('2026-10-15T17:42:37.000Z') }),
    ).toMatch(/^plan usage for this account is exhausted/);
  });

  it('does not treat a successful result that quotes the text as a limit hit', () => {
    const r = decideOutcome(
      log({ subtype: 'success', is_error: false, num_turns: 42, result: realLimitText }),
      { maxTurns: 40, stepOutcome: 'failure' },
    );
    expect(r.pass).toBe(true);
    expect(r.sessionLimit).toBeUndefined();
    expect(r.message).toContain('42 turns');
  });

  it('leaves a plain failure red', () => {
    const r = decideOutcome(
      log({ subtype: 'error_during_execution', is_error: true, result: 'tool call exploded' }),
      { stepOutcome: 'failure' },
    );
    expect(r.pass).toBe(false);
    expect(r.sessionLimit).toBeUndefined();
  });
});

describe('weekly limit outcome', () => {
  const realLimitText = "You've hit your weekly limit · resets 11pm (UTC)";

  it('passes with a warning for the exact production log text and extracts its reset', () => {
    const r = decideOutcome(
      log({ subtype: 'success', is_error: true, result: realLimitText }),
      { stepOutcome: 'failure', now: new Date('2026-10-14T20:10:43.000Z') },
    );
    expect(r.pass).toBe(true);
    expect(r.message).toContain('resets 2026-10-14T23:00:00.000Z');
    expect(r.weeklyLimit).toEqual({ detectedAt: '2026-10-14T20:10:43.000Z', resetAt: '2026-10-14T23:00:00.000Z', parsed: true });
  });

  it('recognises the production wording in failureHint', () => {
    expect(failureHint({ result: realLimitText }, { now: new Date('2026-10-14T20:10:43.000Z') })).toContain('plan usage for this account is exhausted');
  });

  it('does not treat a successful result that quotes the text as a limit hit', () => {
    const r = decideOutcome(
      log({ subtype: 'success', is_error: false, num_turns: 42, result: realLimitText }),
      { maxTurns: 40, stepOutcome: 'failure' },
    );
    expect(r.pass).toBe(true);
    expect(r.weeklyLimit).toBeUndefined();
    expect(r.message).toContain('42 turns');
  });

  it('bounds an unparseable reset to six hours', () => {
    expect(
      weeklyLimitInfo(
        { result: "You've hit your weekly limit - resets sometime later" },
        { now: new Date('2026-10-14T20:00:00.000Z') },
      ),
    ).toEqual({
      detectedAt: '2026-10-14T20:00:00.000Z',
      resetAt: '2026-10-15T02:00:00.000Z',
      parsed: false,
    });
  });

  it('writes the reset in a machine-readable issue line', () => {
    expect(
      weeklyLimitIssueBody({
        detectedAt: '2026-10-14T20:10:43.000Z',
        resetAt: '2026-10-14T23:00:00.000Z',
        parsed: true,
      }),
    ).toContain('claude-weekly-limit-reset: 2026-10-14T23:00:00.000Z');
  });

  it('adds a backup reset without changing the primary reset', () => {
    const body = weeklyLimitIssueBody({
      detectedAt: '2026-10-14T20:10:43.000Z',
      resetAt: '2026-10-14T23:00:00.000Z',
      parsed: true,
      backupResetAt: '2026-10-15T01:00:00.000Z',
      existingBody: 'claude-weekly-limit-reset: 2026-10-14T23:00:00.000Z\nclaude-weekly-limit-detected: unchanged',
    });
    expect(body).toContain('claude-weekly-limit-reset: 2026-10-14T23:00:00.000Z');
    expect(body).toContain('claude-weekly-limit-reset-backup: 2026-10-15T01:00:00.000Z');
  });

  it('preserves a backup reset when the primary rewrites the issue', () => {
    expect(weeklyLimitIssueBody({
      detectedAt: '2026-10-14T20:10:43.000Z', resetAt: '2026-10-14T23:00:00.000Z', parsed: true,
      existingBody: 'claude-weekly-limit-reset-backup: 2026-10-15T01:00:00.000Z',
    })).toContain('claude-weekly-limit-reset-backup: 2026-10-15T01:00:00.000Z');
  });

  it('does not create or rewrite an issue for an unpaired backup limit', () => {
    const limit = { detectedAt: '2026-10-14T20:10:43.000Z', resetAt: '2026-10-14T23:00:00.000Z', parsed: true };
    expect(weeklyLimitIssueUpdate(limit, [], 'backup').warning).toContain('leaving issue state unchanged');
    expect(weeklyLimitIssueUpdate(limit, [{ number: 1, body: '', title: 'existing' }], 'backup').warning).toContain('leaving issue state unchanged');
  });

  it('keeps the issue title for a backup limit', () => {
    const update = weeklyLimitIssueUpdate(
      { detectedAt: '2026-10-14T20:10:43.000Z', resetAt: '2026-10-15T01:00:00.000Z', parsed: true },
      [{ number: 1, body: 'claude-weekly-limit-reset: 2026-10-14T23:00:00.000Z', title: 'primary reset' }], 'backup',
    );
    expect(update.title).toBe('primary reset');
  });

  it('keeps the oldest issue and closes later duplicate issue races', () => {
    const { keeper, duplicates } = dedupeWeeklyLimitIssues([
      { number: 102 },
      { number: 101 },
      { number: 102 },
      { number: 99, pull_request: {} },
    ]);
    expect(keeper.number).toBe(101);
    expect(duplicates.map((issue) => issue.number)).toEqual([102]);
  });
});

describe('routine-template.yml', () => {
  const yml = readFileSync(
    path.resolve(__dirname, '../../.github/workflows/routine-template.yml'),
    'utf8',
  );
  it('lets the Claude step continue on error and gates the outcome in a follow-up step', () => {
    expect(yml).toMatch(
      /id: claude\n\s+if: steps\.guard\.outputs\.skip == 'false'\n\s+continue-on-error: true/,
    );
    expect(yml).toContain('node scripts/routines/session-outcome.mjs');
    expect(yml).toContain('steps.claude.outcome');
  });

  it('selects the Claude OAuth token once from the guard output', () => {
    expect(yml.match(/secrets\.CLAUDE_CODE_OAUTH_TOKEN(?!_)/g)).toHaveLength(1);
    expect(yml).toContain("claude_code_oauth_token: ${{ steps.guard.outputs.token == 'backup' && secrets.CLAUDE_CODE_OAUTH_TOKEN_BACKUP || env.ROUTINE_CLAUDE_TOKEN }}");
    expect(yml).not.toContain('ROUTINE_CLAUDE_BACKUP_TOKEN');
    expect(yml).toContain("HAS_BACKUP: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN_BACKUP != '' }}");
  });
});
