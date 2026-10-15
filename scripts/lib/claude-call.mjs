import { spawn as nodeSpawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectClaudeCallToken } from './claude-token.mjs';
import { issueReset } from '../routines/limit-gate.mjs';
import {
  childEnv,
  inputTokenEstimate,
  resultOf,
  runCli,
  usageOf,
} from './claude-call-process.mjs';
import { limitFailure, schemaMatches, usageRow } from './claude-call-result.mjs';

const PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const BACKUP_PRIORITIES = new Set(['P0', 'P1']);
const DEFAULT_TIMEOUT_MS = 120_000;
const BREAKER_THRESHOLD = 3;

export function createClaudeCaller(options = {}) {
  const spawnImpl = options.spawnImpl ?? nodeSpawn;
  const logUsage = options.logUsage ?? (() => undefined);
  const getLimitState = options.getLimitState ?? issueReset;
  const callCounts = options.callCounts ?? new Map();
  const estimateTokens = options.estimateTokens ?? inputTokenEstimate;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logBreaker = options.logBreaker ?? console.warn;
  let consecutiveUnavailable = 0;
  let breakerOpen = false;
  const createTempDir = options.createTempDir
    ?? (() => mkdtemp(join(tmpdir(), 'claude-call-')));
  const removeTempDir = options.removeTempDir
    ?? ((directory) => rm(directory, { recursive: true, force: true }));
  return async function callClaude(input = {}) {
    if (breakerOpen) {
      return { status: 'unavailable', reason: 'Claude call circuit breaker open' };
    }
    let tempDir;
    let outcome;
    const complete = (value) => {
      outcome = value;
      if (value.status === 'ok') {
        consecutiveUnavailable = 0;
      } else if (value.status === 'unavailable' && value.reason !== 'limit') {
        consecutiveUnavailable += 1;
        if (consecutiveUnavailable >= BREAKER_THRESHOLD) {
          breakerOpen = true;
          try {
            logBreaker('[claude-call] circuit breaker opened after 3 consecutive unavailable calls');
          } catch {
            // Breaker logging cannot violate the never-throw contract.
          }
        }
      }
      return value;
    };
    const attempts = [];
    try {
      const {
        caller,
        priority,
        model,
        system,
        user,
        schema,
        maxInputTokens,
        maxCalls,
      } = input;
      if (!caller || !model || typeof system !== 'string' || typeof user !== 'string'
        || !PRIORITIES.has(priority)) {
        return complete({ status: 'invalid', reason: 'invalid Claude call arguments' });
      }
      if (maxCalls !== undefined && (!Number.isInteger(maxCalls) || maxCalls < 0)) {
        return complete({ status: 'invalid', reason: 'maxCalls must be a non-negative integer' });
      }
      if (maxInputTokens !== undefined
        && (!Number.isFinite(maxInputTokens) || maxInputTokens < 0)) {
        return complete({ status: 'invalid', reason: 'maxInputTokens must be non-negative' });
      }
      let schemaJson;
      if (schema !== undefined) {
        if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
          return complete({ status: 'invalid', reason: 'schema must be a JSON Schema object' });
        }
        try {
          schemaJson = JSON.stringify(schema);
        } catch {
          return complete({ status: 'invalid', reason: 'schema must be serializable' });
        }
      }
      const calls = callCounts.get(caller) ?? 0;
      if (maxCalls !== undefined && calls >= maxCalls) {
        return complete({ status: 'capped', reason: 'per-run call cap reached' });
      }
      if (maxInputTokens !== undefined && estimateTokens(system, user) > maxInputTokens) {
        return complete({ status: 'capped', reason: 'input token cap exceeded' });
      }
      const limitState = await getLimitState(input.limitIssue);
      const tokens = {
        primary: process.env.CLAUDE_CODE_OAUTH_TOKEN,
        backup: process.env.CLAUDE_CODE_OAUTH_TOKEN_BACKUP,
      };
      const tokenChoice = selectClaudeCallToken({
        limitState,
        hasBackup: Boolean(tokens.backup),
        priority,
      });
      if (tokenChoice.token === 'none') {
        const resetAt = tokenChoice.resetAt;
        return complete({
          status: 'unavailable',
          reason: 'limit',
          ...(resetAt ? { usage: { ...usageOf(null), resetAt } } : {}),
        });
      }
      if (!tokens[tokenChoice.token]) {
        return complete({ status: 'unavailable', reason: 'Claude subscription token unavailable' });
      }

      const args = ['-p', '--output-format', 'json', '--safe-mode', '--setting-sources', '',
        '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--tools', '',
        '--no-session-persistence',
        '--model', model, '--system-prompt', system];
      if (schemaJson !== undefined) args.push('--json-schema', schemaJson);
      tempDir = await createTempDir();
      callCounts.set(caller, calls + 1);
      let token = tokenChoice.token;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const completed = await runCli(
          spawnImpl,
          args,
          { cwd: tempDir, env: childEnv(tokens[token]), windowsHide: true },
          user,
          timeoutMs,
        );
        const result = resultOf(completed?.stdout);
        let usage = usageOf(result);
        const limited = completed?.code !== 0 || result?.is_error === true
          ? limitFailure(result) : null;
        if (limited?.resetAt) usage = { ...usage, resetAt: limited.resetAt };
        attempts.push({ token, usage });

        if (limited) {
          const retryState = {
            ...limitState,
            resetAt: limited.resetAt ?? new Date(Date.now() + 60_000).toISOString(),
          };
          const retry = selectClaudeCallToken({
            limitState: retryState,
            hasBackup: Boolean(tokens.backup),
            priority,
          });
          if (attempt === 0 && token === 'primary' && retry.token === 'backup'
            && BACKUP_PRIORITIES.has(priority)) {
            token = 'backup';
            continue;
          }
          return complete({ status: 'unavailable', reason: 'limit', usage });
        }
        if (!completed || completed.timedOut || completed.code !== 0) {
          const reason = completed?.timedOut ? 'Claude CLI timed out' : 'Claude CLI unavailable';
          return complete({ status: 'unavailable', reason, usage });
        }
        if (!result) {
          return complete({ status: 'invalid', reason: 'Claude CLI returned invalid JSON' });
        }
        if (result.is_error === true) {
          return complete({ status: 'unavailable', usage, reason: 'Claude CLI reported an error' });
        }

        let data = result.result;
        if (schema !== undefined) {
          try {
            data = result.structured_output ?? JSON.parse(result.result);
          } catch {
            return complete({ status: 'invalid', usage, reason: 'Claude returned invalid result JSON' });
          }
          try {
            if (!schemaMatches(data, schema)) {
              return complete({ status: 'invalid', usage, reason: 'Claude result missed the schema' });
            }
          } catch {
            return complete({ status: 'invalid', usage, reason: 'Claude result schema was invalid' });
          }
        }
        return complete({ status: 'ok', data, usage });
      }
      return complete({ status: 'unavailable', reason: 'Claude CLI unavailable' });
    } catch {
      return complete({ status: 'unavailable', reason: 'Claude call unavailable' });
    } finally {
      if (tempDir) {
        try {
          await removeTempDir(tempDir);
        } catch {
          // Temporary-directory cleanup cannot violate the never-throw contract.
        }
      }
      for (const attempt of attempts) {
        try {
          await logUsage(usageRow(input, attempt.token, attempt.usage));
        } catch { outcome.loggerError = true; }
      }
    }
  };
}

export const callClaude = createClaudeCaller();
