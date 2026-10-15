import { failureHint, weeklyLimitInfo } from '../routines/session-outcome.mjs';

export function limitFailure(result) {
  const hint = failureHint(result);
  if (/hit your session limit/i.test(result?.result ?? '')) {
    return { reason: 'limit' };
  }
  if (!hint?.startsWith('plan usage for this account is exhausted')) return null;
  const resetAt = weeklyLimitInfo(result)?.resetAt
    ?? hint.split(', resets ')[1]?.slice(0, 24);
  return resetAt ? { reason: 'limit', resetAt } : { reason: 'limit' };
}

export function usageRow(input, token, usage) {
  return {
    caller: input.caller,
    provider: 'claude-subscription',
    model: input.model,
    token,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cache_read_tokens: usage.cacheReadInputTokens,
    cache_creation_input_tokens: usage.cacheCreationInputTokens,
    calls: 1,
  };
}

function matchesType(value, type) {
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  return typeof value === type;
}

export function schemaMatches(value, schema) {
  if (schema === true) return true;
  if (!schema || schema === false || typeof schema !== 'object' || Array.isArray(schema)) {
    return false;
  }
  if (schema.const !== undefined && !Object.is(value, schema.const)) return false;
  if (Array.isArray(schema.enum)
    && !schema.enum.some((item) => Object.is(item, value))) return false;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (types.length && !types.some((type) => matchesType(value, type))) return false;
  if (Array.isArray(schema.allOf)
    && !schema.allOf.every((item) => schemaMatches(value, item))) return false;
  if (Array.isArray(schema.anyOf)
    && !schema.anyOf.some((item) => schemaMatches(value, item))) return false;
  if (Array.isArray(schema.oneOf)
    && schema.oneOf.filter((item) => schemaMatches(value, item)).length !== 1) return false;

  if (typeof value === 'string') {
    if (Number.isFinite(schema.minLength) && value.length < schema.minLength) return false;
    if (Number.isFinite(schema.maxLength) && value.length > schema.maxLength) return false;
    if (typeof schema.pattern === 'string'
      && !new RegExp(schema.pattern, schema.patternFlags).test(value)) return false;
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
