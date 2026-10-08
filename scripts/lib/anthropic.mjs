// Plain-JS twin of packages/shared/src/llm/anthropic-messages.ts (Fable 5.1
// architecture review, task R3). The merch-engine/appearance-discovery
// scripts run under plain `node` with no TS loader, so they can't `import`
// the TS module — this file mirrors its behaviour (same options, same
// error shape, same defaults) for `.mjs` callers.
//
// KEEP IN LOCKSTEP with packages/shared/src/llm/anthropic-messages.ts when
// either changes: same URL/version constants, same call signature, same
// tool-extraction contract.

export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

/**
 * THE shared wire primitive — one POST to the Messages API. No retry;
 * callers own their own retry policy.
 *
 * @param {string} apiKey
 * @param {Record<string, unknown>} body
 * @param {{
 *   timeoutMs?: number,
 *   signal?: AbortSignal,
 *   fetchImpl?: typeof fetch,
 *   errorLabel?: string,
 *   includeBodyTextInError?: boolean,
 * }} [options]
 * @returns {Promise<{ raw: unknown, usage: { inputTokens: number, outputTokens: number } }>}
 */
export async function callAnthropicMessages(apiKey, body, options = {}) {
  const {
    timeoutMs,
    signal,
    fetchImpl = fetch,
    errorLabel = 'Anthropic Messages API call',
    includeBodyTextInError = false,
  } = options;

  let controller;
  let timer;
  let onExternalAbort;
  let effectiveSignal = signal;

  if (timeoutMs !== undefined) {
    controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);
    if (signal) {
      onExternalAbort = () => controller.abort();
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', onExternalAbort);
    }
    effectiveSignal = controller.signal;
  }

  try {
    const res = await fetchImpl(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      ...(effectiveSignal ? { signal: effectiveSignal } : {}),
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = includeBodyTextInError
        ? `: ${await res.text().catch(() => '')}`
        : '';
      throw new Error(`${errorLabel} failed (${res.status})${detail}`);
    }
    const json = await res.json();
    const rawUsage = json?.usage;
    const inputTokens = typeof rawUsage?.input_tokens === 'number' ? rawUsage.input_tokens : 0;
    const outputTokens = typeof rawUsage?.output_tokens === 'number' ? rawUsage.output_tokens : 0;
    return { raw: json, usage: { inputTokens, outputTokens } };
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && onExternalAbort) signal.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * Pull a forced tool's input out of a Messages API response body. Returns
 * `null` when no matching `tool_use` block is present at all.
 *
 * @param {unknown} body
 * @param {{ toolName?: string, fallback?: unknown }} [options]
 */
export function extractToolUseInput(body, options = {}) {
  const { toolName, fallback = null } = options;
  const content = body?.content;
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (block && typeof block === 'object' && block.type === 'tool_use') {
      if (toolName && block.name !== toolName) continue;
      return block.input ?? fallback;
    }
  }
  return null;
}
