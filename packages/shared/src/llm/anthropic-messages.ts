/**
 * The one Anthropic Messages client for the repo (Fable 5.1 architecture
 * review, task R3). Every caller that talks to `POST /v1/messages` — Mood
 * Chat's classifier, Clownbot, the worker's Haiku extract stage, the
 * appearance-discovery Taylor-presence vision check, and the merch-engine
 * E3/E6 vision/descriptor authoring scripts — goes through
 * `callAnthropicMessages` below so the transport (endpoint, headers,
 * timeout/abort wiring, usage parsing, HTTP-error shape) is identical
 * everywhere instead of five hand-copied `fetch()` calls drifting apart.
 *
 * Model selection stays per-caller on purpose (Fable 5.1 ruling) — this
 * module never picks or defaults a model; every caller passes its own
 * `model` field in `body`.
 *
 * A plain-JS twin of this file lives at `scripts/lib/anthropic.mjs` for the
 * merch-engine/appearance-discovery `.mjs` scripts, which run under plain
 * `node` (no TS loader) and can't `import` this file directly. Keep the two
 * in behavioral lockstep — same options, same error shape, same defaults —
 * when either changes.
 */

export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

/** Anthropic `usage` block, normalised to camelCase. */
export interface AnthropicCallUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AnthropicCallResult {
  /** The full parsed response body — callers extract what they need
   * (typically via `extractToolUseInput` below). */
  raw: unknown;
  usage: AnthropicCallUsage;
}

export interface AnthropicMessagesCallOptions {
  /** When set, aborts the request after this many ms. Omit for no timeout
   * (matches callers that never had one, e.g. the worker's extract stage). */
  timeoutMs?: number;
  /** An external abort signal (e.g. a caller's own request-wide deadline).
   * Combined with `timeoutMs`'s own timer when both are supplied — whichever
   * fires first wins — same as Clownbot's original `callAnthropicMessages`. */
  signal?: AbortSignal;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Prefix used to build the thrown error's message on a non-2xx response:
   * `${errorLabel} failed (${status})`. Callers keep their own historical
   * wording (e.g. "anthropic classify", "Anthropic extract") so existing
   * error-message assertions and logs are unaffected by the migration. */
  errorLabel?: string;
  /** When true, appends `: <response body text>` to the thrown error — only
   * the worker's extract stage wants this (so a genuine API failure logs
   * enough detail to diagnose the deferred cluster). */
  includeBodyTextInError?: boolean;
}

/**
 * THE shared wire primitive — one POST to the Messages API. No retry;
 * callers own their own retry policy (most do a single one-shot retry
 * around this call, unchanged by this migration).
 */
export async function callAnthropicMessages(
  apiKey: string,
  body: Record<string, unknown>,
  options: AnthropicMessagesCallOptions = {},
): Promise<AnthropicCallResult> {
  const {
    timeoutMs,
    signal,
    fetchImpl = fetch,
    errorLabel = 'Anthropic Messages API call',
    includeBodyTextInError = false,
  } = options;

  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onExternalAbort: (() => void) | undefined;
  let effectiveSignal = signal;

  if (timeoutMs !== undefined) {
    controller = new AbortController();
    timer = setTimeout(() => controller!.abort(), timeoutMs);
    if (signal) {
      onExternalAbort = () => controller!.abort();
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
      const detail = includeBodyTextInError ? `: ${await res.text().catch(() => '')}` : '';
      throw new Error(`${errorLabel} failed (${res.status})${detail}`);
    }
    const json = await res.json();
    const rawUsage = (json as { usage?: { input_tokens?: unknown; output_tokens?: unknown } } | null)?.usage;
    const inputTokens = typeof rawUsage?.input_tokens === 'number' ? rawUsage.input_tokens : 0;
    const outputTokens = typeof rawUsage?.output_tokens === 'number' ? rawUsage.output_tokens : 0;
    return { raw: json, usage: { inputTokens, outputTokens } };
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && onExternalAbort) signal.removeEventListener('abort', onExternalAbort);
  }
}

export interface ExtractToolUseInputOptions {
  /** Only match a `tool_use` block with this exact `name`. Omit to accept
   * the first `tool_use` block regardless of name (Clownbot/Mood/extract's
   * original behaviour — each of those calls forces exactly one tool via
   * `tool_choice`, so "first tool_use block" is unambiguous). */
  toolName?: string;
  /** Value returned when a matching block is found but its `input` field is
   * missing. Defaults to `null`. Pass `{}` to match callers that historically
   * treated a present-but-empty input as "proceed with an empty object"
   * rather than "no tool_use block". */
  fallback?: unknown;
}

/** Pull a forced tool's input out of a Messages API response body. Returns
 * `null` when no matching `tool_use` block is present at all. */
export function extractToolUseInput(body: unknown, options: ExtractToolUseInputOptions = {}): unknown {
  const { toolName, fallback = null } = options;
  const content = (body as { content?: unknown })?.content;
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (block && typeof block === 'object' && (block as { type?: string }).type === 'tool_use') {
      if (toolName && (block as { name?: string }).name !== toolName) continue;
      return (block as { input?: unknown }).input ?? fallback;
    }
  }
  return null;
}
