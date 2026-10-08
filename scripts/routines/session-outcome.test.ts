import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { decideOutcome, failureHint, resultDetail } from './session-outcome.mjs';

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
});
