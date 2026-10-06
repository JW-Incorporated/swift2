import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { decideOutcome } from './session-outcome.mjs';

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

  it('fails on a genuine turn cutoff', () => {
    const r = decideOutcome(log({ subtype: 'error_max_turns', is_error: false, num_turns: 40 }), {
      stepOutcome: 'failure',
    });
    expect(r.pass).toBe(false);
  });

  it('fails when is_error is true even with subtype success', () => {
    expect(decideOutcome(log({ subtype: 'success', is_error: true }), { stepOutcome: 'failure' }).pass).toBe(false);
  });

  it('fails on error_during_execution', () => {
    expect(
      decideOutcome(log({ subtype: 'error_during_execution', is_error: true }), { stepOutcome: 'failure' }).pass,
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
});

describe('routine-template.yml', () => {
  const yml = readFileSync(path.resolve(__dirname, '../../.github/workflows/routine-template.yml'), 'utf8');
  it('lets the Claude step continue on error and gates the outcome in a follow-up step', () => {
    expect(yml).toMatch(/id: claude\n\s+if: steps\.guard\.outputs\.skip == 'false'\n\s+continue-on-error: true/);
    expect(yml).toContain('node scripts/routines/session-outcome.mjs');
    expect(yml).toContain('steps.claude.outcome');
  });
});
