import { spawn as nodeSpawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectClaudeCallToken } from './claude-token.mjs';
import { issueReset } from '../routines/limit-gate.mjs';
import { failureHint, weeklyLimitInfo } from '../routines/session-outcome.mjs';
const PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const BACKUP_PRIORITIES = new Set(['P0', 'P1']);
const DEFAULT_TIMEOUT_MS = 120_000;
const ENV_ALLOWLIST = ['PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA',
  'TEMP', 'TMP', 'TMPDIR', 'SystemRoot', 'ComSpec'];

function inputTokenEstimate(system, user) {
  return Math.ceil(Buffer.byteLength(`${system}\n${user}`, 'utf8') / 4);
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function usageOf(result) {
  const usage = result?.usage ?? {};
  return {
    inputTokens: number(usage.input_tokens),
    cacheCreationInputTokens: number(usage.cache_creation_input_tokens),
    cacheReadInputTokens: number(usage.cache_read_input_tokens),
    outputTokens: number(usage.output_tokens),
  };
}

function childEnv(token) {
  const env = {};
  for (const key of ENV_ALLOWLIST)
    if (process.env[key] !== undefined) env[key] = process.env[key];
  env.CLAUDE_CODE_OAUTH_TOKEN = token;
  return env;
}

function resultOf(stdout) {
  if (!stdout) return null;
  try { return JSON.parse(stdout); } catch { return null; }
}
function limitFailure(result) {
  const hint = failureHint(result);
  if (/hit your session limit/i.test(result?.result ?? '')) return { reason: 'limit' };
  if (!hint?.startsWith('plan usage for this account is exhausted')) return null;
  const resetAt = weeklyLimitInfo(result)?.resetAt ?? hint.split(', resets ')[1]?.slice(0, 24);
  return resetAt ? { reason: 'limit', resetAt } : { reason: 'limit' };
}

function usageRow(input, token, usage) {
  return {
    caller: input.caller, provider: 'claude-subscription',
    model: input.model, token,
    input_tokens: usage.inputTokens, output_tokens: usage.outputTokens,
    cache_read_tokens: usage.cacheReadInputTokens, calls: 1,
  };
}

function matchesType(value, type) {
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type;
}

function schemaMatches(value, schema) {
  if (schema === true) return true;
  if (!schema || schema === false || typeof schema !== 'object' || Array.isArray(schema)) return false;
  if (schema.const !== undefined && !Object.is(value, schema.const)) return false;
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => Object.is(item, value))) return false;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.length && !types.some((type) => matchesType(value, type))) return false;
  if (Array.isArray(schema.allOf) && !schema.allOf.every((item) => schemaMatches(value, item))) return false;
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((item) => schemaMatches(value, item))) return false;
  if (Array.isArray(schema.oneOf) && schema.oneOf
    .filter((item) => schemaMatches(value, item)).length !== 1) return false;

  if (typeof value === 'string') {
    if (Number.isFinite(schema.minLength) && value.length < schema.minLength) return false;
    if (Number.isFinite(schema.maxLength) && value.length > schema.maxLength) return false;
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, schema.patternFlags).test(value)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(schema.minimum) && value < schema.minimum) return false;
    if (Number.isFinite(schema.maximum) && value > schema.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (Number.isFinite(schema.minItems) && value.length < schema.minItems) return false;
    if (Number.isFinite(schema.maxItems) && value.length > schema.maxItems) return false;
    if (schema.items && !value.every((item) => schemaMatches(item, schema.items))) return false;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required) && !schema.required
      .every((key) => Object.hasOwn(value, key))) return false;
    const properties = schema.properties ?? {};
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, key) && !schemaMatches(value[key], propertySchema)) return false;
    }
    if (schema.additionalProperties === false && Object.keys(value)
      .some((key) => !Object.hasOwn(properties, key))) return false;
  }
  return true;
}

function runCli(spawnImpl, args, options, user, timeoutMs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl('claude', args, options);
    } catch { resolve(null); return; }
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      try { child.kill(); } catch {
        // The timeout result is authoritative even when process cleanup fails.
      }
      finish({ timedOut: true, stdout, stderr });
    }, timeoutMs);
    try {
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => { stdout += chunk; });
      child.stderr?.on('data', (chunk) => { stderr += chunk; });
      child.on('error', () => finish(null));
      child.on('close', (code) => finish({ code, stdout, stderr, timedOut: false }));
      child.stdin?.on('error', () => finish(null));
      child.stdin?.end(user);
    } catch { finish(null); }
  });
}

export function createClaudeCaller(options = {}) {
  const spawnImpl = options.spawnImpl ?? nodeSpawn;
  const logUsage = options.logUsage ?? (() => undefined);
  const getLimitState = options.getLimitState ?? issueReset;
  const callCounts = options.callCounts ?? new Map();
  const estimateTokens = options.estimateTokens ?? inputTokenEstimate;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const createTempDir = options.createTempDir
    ?? (() => mkdtemp(join(tmpdir(), 'claude-call-')));
  const removeTempDir = options.removeTempDir
    ?? ((directory) => rm(directory, { recursive: true, force: true }));
  return async function callClaude(input = {}) {
    let tempDir;
    let outcome;
    const complete = (value) => (outcome = value);
    const attempts = [];
    try {
      const { caller, priority, model, system, user, schema, maxInputTokens, maxCalls } = input;
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
