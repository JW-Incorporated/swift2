import { spawn as nodeSpawn } from 'node:child_process';
import { selectClaudeCallToken } from './claude-token.mjs';

const PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const DEFAULT_TIMEOUT_MS = 120_000;

function inputTokenEstimate(system, user) {
  return Math.ceil(Buffer.byteLength(`${system}\n${user}`, 'utf8') / 4);
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function usageOf(result) {
  const usage = result?.usage ?? {};
  return {
    inputTokens: number(usage.input_tokens) + number(usage.cache_creation_input_tokens)
      + number(usage.cache_read_input_tokens),
    outputTokens: number(usage.output_tokens),
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
  if (Array.isArray(schema.oneOf)
    && schema.oneOf.filter((item) => schemaMatches(value, item)).length !== 1) return false;

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
    if (Array.isArray(schema.required)
      && !schema.required.every((key) => Object.hasOwn(value, key))) return false;
    const properties = schema.properties ?? {};
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, key) && !schemaMatches(value[key], propertySchema)) return false;
    }
    if (schema.additionalProperties === false
      && Object.keys(value).some((key) => !Object.hasOwn(properties, key))) return false;
  }
  return true;
}

function runCli(spawnImpl, args, options, user, timeoutMs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl('claude', args, options);
    } catch {
      resolve(null);
      return;
    }
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
      try {
        child.kill();
      } catch {
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
      child.stdin?.end(user);
    } catch {
      finish(null);
    }
  });
}

export function createClaudeCaller(options = {}) {
  const spawnImpl = options.spawnImpl ?? nodeSpawn;
  const logUsage = options.logUsage ?? (() => undefined);
  const getLimitState = options.getLimitState ?? (() => null);
  const callCounts = options.callCounts ?? new Map();
  const estimateTokens = options.estimateTokens ?? inputTokenEstimate;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function callClaude(input = {}) {
    let spawned = false;
    let usage = { inputTokens: 0, outputTokens: 0 };
    let status = 'unavailable';
    try {
      const { caller, priority, model, system, user, schema, maxInputTokens, maxCalls } = input;
      if (!caller || !model || typeof system !== 'string' || typeof user !== 'string'
        || !PRIORITIES.has(priority)) {
        return { status: 'invalid', reason: 'invalid Claude call arguments' };
      }
      if (maxCalls !== undefined && (!Number.isInteger(maxCalls) || maxCalls < 0)) {
        return { status: 'invalid', reason: 'maxCalls must be a non-negative integer' };
      }
      if (maxInputTokens !== undefined
        && (!Number.isFinite(maxInputTokens) || maxInputTokens < 0)) {
        return { status: 'invalid', reason: 'maxInputTokens must be non-negative' };
      }
      let schemaJson;
      if (schema !== undefined) {
        if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
          return { status: 'invalid', reason: 'schema must be a JSON Schema object' };
        }
        try {
          schemaJson = JSON.stringify(schema);
        } catch {
          return { status: 'invalid', reason: 'schema must be serializable' };
        }
      }
      const calls = callCounts.get(caller) ?? 0;
      if (maxCalls !== undefined && calls >= maxCalls) {
        return { status: 'capped', reason: 'per-run call cap reached' };
      }
      if (maxInputTokens !== undefined && estimateTokens(system, user) > maxInputTokens) {
        return { status: 'capped', reason: 'input token cap exceeded' };
      }

      const limitState = await getLimitState();
      const backupToken = process.env.CLAUDE_CODE_OAUTH_TOKEN_BACKUP;
      const tokenChoice = selectClaudeCallToken({
        limitState,
        hasBackup: Boolean(backupToken),
        priority,
      });
      if (tokenChoice.token === 'none') {
        const capped = priority === 'P2' || priority === 'P3';
        return { status: capped ? 'capped' : 'unavailable', reason: tokenChoice.reason };
      }

      const args = ['-p', '--max-turns', '1', '--output-format', 'json', '--tools', '',
        '--no-session-persistence', '--model', model, '--system-prompt', system];
      if (schemaJson !== undefined) args.push('--json-schema', schemaJson);
      const env = { ...process.env };
      if (tokenChoice.token === 'backup') env.CLAUDE_CODE_OAUTH_TOKEN = backupToken;
      callCounts.set(caller, calls + 1);
      spawned = true;
      const completed = await runCli(spawnImpl, args, { env, windowsHide: true }, user, timeoutMs);
      if (!completed || completed.timedOut || completed.code !== 0) {
        status = 'unavailable';
        return { status, reason: completed?.timedOut ? 'Claude CLI timed out' : 'Claude CLI unavailable' };
      }

      let result;
      try {
        result = JSON.parse(completed.stdout);
      } catch {
        status = 'invalid';
        return { status, reason: 'Claude CLI returned invalid JSON' };
      }
      usage = usageOf(result);
      if (result?.is_error === true) {
        status = 'unavailable';
        return { status, usage, reason: 'Claude CLI reported an error' };
      }

      let data = result?.result;
      if (schema !== undefined) {
        try {
          data = result?.structured_output ?? JSON.parse(result?.result);
        } catch {
          status = 'invalid';
          return { status, usage, reason: 'Claude returned invalid result JSON' };
        }
        let matches = false;
        try {
          matches = schemaMatches(data, schema);
        } catch {
          status = 'invalid';
          return { status, usage, reason: 'Claude result schema was invalid' };
        }
        if (!matches) {
          status = 'invalid';
          return { status, usage, reason: 'Claude result missed the schema' };
        }
      }
      status = 'ok';
      return { status, data, usage };
    } catch {
      return { status: 'unavailable', reason: 'Claude call unavailable' };
    } finally {
      if (spawned) {
        try {
          await logUsage({
            caller: input.caller,
            model: input.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            calls: 1,
            status,
          });
        } catch {
          // Usage telemetry cannot violate the never-throw caller contract.
        }
      }
    }
  };
}

export const callClaude = createClaudeCaller();
