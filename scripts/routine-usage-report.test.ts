import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  findResultMessage,
  findAssistantError,
  buildUsageRecord,
  isNearTurnLimit,
  renderSummary,
} from './routine-usage-report.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT = path.resolve(__dirname, 'routine-usage-report.mjs');

describe('findResultMessage', () => {
  it('finds the terminal result message in an execution log', () => {
    const log = [
      { type: 'system' },
      { type: 'assistant', message: { content: [] } },
      { type: 'result', num_turns: 5, duration_ms: 1000, total_cost_usd: 0.05, usage: { input_tokens: 10 } },
    ];
    expect(findResultMessage(log)).toEqual(log[2]);
  });

  it('returns null when there is no result message', () => {
    expect(findResultMessage([{ type: 'system' }, { type: 'assistant' }])).toBeNull();
  });

  it('returns null for a non-array input', () => {
    expect(findResultMessage(null)).toBeNull();
    expect(findResultMessage({})).toBeNull();
  });

  it('returns null for an empty array', () => {
    expect(findResultMessage([])).toBeNull();
  });
});

describe('buildUsageRecord', () => {
  it('maps a result message plus static config into a usage record', () => {
    const record = buildUsageRecord({
      routineName: 'News Triage',
      model: 'claude-sonnet-5',
      maxTurns: 40,
      result: { num_turns: 12, duration_ms: 45000, total_cost_usd: 0.31, usage: { input_tokens: 100 } },
    });
    expect(record).toMatchObject({
      routineName: 'News Triage',
      model: 'claude-sonnet-5',
      maxTurns: 40,
      numTurns: 12,
      durationMs: 45000,
      totalCostUsd: 0.31,
      usage: { input_tokens: 100 },
    });
    expect(typeof record.generatedAt).toBe('string');
  });

  it('defaults missing result fields to null instead of throwing', () => {
    const record = buildUsageRecord({ routineName: 'x', model: 'y', maxTurns: 10, result: {} });
    expect(record.numTurns).toBeNull();
    expect(record.durationMs).toBeNull();
    expect(record.totalCostUsd).toBeNull();
    expect(record.usage).toBeNull();
  });

  it('adds only fixed diagnostic metadata for an errored result', () => {
    const record = buildUsageRecord({
      routineName: 'x', model: 'y', maxTurns: 10,
      result: { is_error: true, subtype: 'success' }, assistantError: 'authentication_failed',
    });
    expect(record.diagnostic).toEqual({ isError: true, resultSubtype: 'success', assistantError: 'authentication_failed' });
    expect(JSON.stringify(record)).not.toContain('secret');
  });

  it('maps unknown result subtypes to unknown', () => {
    const record = buildUsageRecord({ routineName: 'x', model: 'y', maxTurns: 10, result: { is_error: true, subtype: 'provider-private-detail' } });
    expect(record.diagnostic).toEqual({ isError: true, resultSubtype: 'unknown' });
  });

  it('keeps successful record shape unchanged', () => {
    const record = buildUsageRecord({ routineName: 'x', model: 'y', maxTurns: 10, result: {} });
    expect(record).not.toHaveProperty('diagnostic');
  });

  it('does not add diagnostics to a successful result with an assistant error', () => {
    const record = buildUsageRecord({ routineName: 'x', model: 'y', maxTurns: 10, result: {}, assistantError: 'rate_limit' });
    expect(record).not.toHaveProperty('diagnostic');
  });

  it('sanitizes assistant errors at the output boundary', () => {
    const record = buildUsageRecord({ routineName: 'x', model: 'y', maxTurns: 10, result: { is_error: true }, assistantError: 'secret-token' });
    expect(record.diagnostic).toEqual({ isError: true, resultSubtype: 'unknown', assistantError: 'unknown' });
  });
});

describe('findAssistantError', () => {
  it('allows SDK error enums and maps untrusted strings to unknown', () => {
    const errors = ['authentication_failed', 'oauth_org_not_allowed', 'billing_error', 'rate_limit', 'invalid_request', 'model_not_found', 'server_error', 'max_output_tokens', 'unknown'];
    for (const error of errors) expect(findAssistantError([{ type: 'assistant', error }])).toBe(error);
    expect(findAssistantError([{ type: 'assistant', message: { error: 'Bearer secret-token' } }])).toBe('unknown');
  });

  it('ignores non-assistant content and missing errors', () => {
    expect(findAssistantError([{ type: 'result', error: 'rate_limit' }])).toBeNull();
    expect(findAssistantError([{ type: 'assistant', message: { content: 'private text' } }])).toBeNull();
  });
});

describe('isNearTurnLimit', () => {
  it('is false comfortably under 90% of max turns', () => {
    expect(isNearTurnLimit(10, 40)).toBe(false);
  });

  it('is true at exactly 90% of max turns', () => {
    expect(isNearTurnLimit(36, 40)).toBe(true);
  });

  it('is true above 90% of max turns', () => {
    expect(isNearTurnLimit(39, 40)).toBe(true);
  });

  it('is false for non-finite or invalid inputs', () => {
    expect(isNearTurnLimit(NaN, 40)).toBe(false);
    expect(isNearTurnLimit(10, 0)).toBe(false);
    expect(isNearTurnLimit(10, NaN)).toBe(false);
  });
});

describe('renderSummary', () => {
  it('renders routine name, model, turns, duration, and a list-price cost caveat', () => {
    const summary = renderSummary({
      routineName: 'News Triage',
      model: 'claude-sonnet-5',
      numTurns: 12,
      maxTurns: 40,
      durationMs: 65000,
      totalCostUsd: 0.31,
    });
    expect(summary).toContain('News Triage');
    expect(summary).toContain('claude-sonnet-5');
    expect(summary).toContain('12 / 40');
    expect(summary).toContain('1m 5s');
    expect(summary).toContain('list-price equivalent');
    expect(summary).toContain('not billed');
  });

  it('renders unknowns gracefully when fields are missing', () => {
    const summary = renderSummary({ routineName: 'x', model: 'y', numTurns: null, maxTurns: null, durationMs: NaN, totalCostUsd: NaN });
    expect(summary).toContain('unknown / unknown');
    expect(summary).toContain('Duration: unknown');
    expect(summary).toContain('Cost');
  });
});

describe('CLI entry point — must never fail the job', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'routine-usage-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('exits 0 with a no-op notice when EXECUTION_FILE is unset', async () => {
    const { stdout } = await execFileAsync('node', [SCRIPT], {
      env: { ...process.env, EXECUTION_FILE: '', ROUTINE_NAME: 'test-routine' },
    });
    expect(stdout).toContain('::notice::');
    expect(stdout).toContain('nothing to report');
  });

  it('exits 0 with a no-op notice when the execution file is missing', async () => {
    const { stdout } = await execFileAsync('node', [SCRIPT], {
      env: {
        ...process.env,
        EXECUTION_FILE: path.join(dir, 'does-not-exist.json'),
        ROUTINE_NAME: 'test-routine',
      },
    });
    expect(stdout).toContain('::notice::');
  });

  it('exits 0 with a no-op notice when the execution file is malformed JSON', async () => {
    const file = path.join(dir, 'execution.json');
    await writeFile(file, '{ not valid json');
    const { stdout } = await execFileAsync('node', [SCRIPT], {
      env: { ...process.env, EXECUTION_FILE: file, ROUTINE_NAME: 'test-routine' },
    });
    expect(stdout).toContain('::notice::');
  });

  it('writes a usage report and job summary on a normal execution file', async () => {
    const file = path.join(dir, 'execution.json');
    const summaryFile = path.join(dir, 'summary.md');
    const outFile = path.join(dir, 'routine-usage.json');
    await writeFile(
      file,
      JSON.stringify([
        { type: 'system' },
        { type: 'result', num_turns: 5, duration_ms: 12000, total_cost_usd: 0.12, usage: { input_tokens: 500 } },
      ]),
    );
    const { stdout } = await execFileAsync('node', [SCRIPT], {
      env: {
        ...process.env,
        EXECUTION_FILE: file,
        ROUTINE_NAME: 'test-routine',
        ROUTINE_MODEL: 'claude-sonnet-5',
        MAX_TURNS: '40',
        GITHUB_STEP_SUMMARY: summaryFile,
        ROUTINE_USAGE_OUT: outFile,
      },
    });
    expect(stdout).toContain('::notice::');
    const summaryContent = await readFile(summaryFile, 'utf8');
    expect(summaryContent).toContain('test-routine');
    const written = JSON.parse(await readFile(outFile, 'utf8'));
    expect(written.numTurns).toBe(5);
    expect(written.totalCostUsd).toBe(0.12);
  });

  it('emits a warning when turns are at or above 90% of max-turns', async () => {
    const file = path.join(dir, 'execution.json');
    await writeFile(
      file,
      JSON.stringify([{ type: 'result', num_turns: 38, duration_ms: 1000, total_cost_usd: 0.01, usage: {} }]),
    );
    const { stdout } = await execFileAsync('node', [SCRIPT], {
      env: {
        ...process.env,
        EXECUTION_FILE: file,
        ROUTINE_NAME: 'test-routine',
        MAX_TURNS: '40',
        ROUTINE_USAGE_OUT: path.join(dir, 'routine-usage.json'),
      },
    });
    expect(stdout).toContain('::warning::');
    expect(stdout).toContain('turn-exhaustion');
  });

  it('never exits non-zero even when GITHUB_STEP_SUMMARY points at an unwritable path', async () => {
    const file = path.join(dir, 'execution.json');
    await writeFile(
      file,
      JSON.stringify([{ type: 'result', num_turns: 1, duration_ms: 100, total_cost_usd: 0.01, usage: {} }]),
    );
    await expect(
      execFileAsync('node', [SCRIPT], {
        env: {
          ...process.env,
          EXECUTION_FILE: file,
          ROUTINE_NAME: 'test-routine',
          GITHUB_STEP_SUMMARY: path.join(dir, 'nonexistent-subdir', 'summary.md'),
          ROUTINE_USAGE_OUT: path.join(dir, 'routine-usage.json'),
        },
      }),
    ).resolves.toBeDefined();
  });
});
