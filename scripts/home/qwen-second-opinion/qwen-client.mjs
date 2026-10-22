// OpenAI-compatible chat call to the home Qwen gateway. Never logs keys.
import { cleanReply } from './message.mjs';

export const DEFAULT_MODEL = 'local-worker';
export const DEFAULT_FALLBACK_MODEL = 'local-orchestrator';
export const MAX_TOKENS = 600;
export const TIMEOUT_MS = 120_000;
export const TRIES_PER_MODEL = 2;

/** Idempotent: ends with exactly one /v1. */
export function normalizeBaseUrl(base) {
  const trimmed = String(base ?? '').trim().replace(/\/+$/, '');
  return trimmed.replace(/\/v1$/, '') + '/v1';
}

/** One request. Resolves { ok, text } | { ok:false, kind:'network'|'http'|'empty', status?, retryable, message }. */
export async function callOnce({ baseUrl, apiKey, model, messages, fetchImpl = fetch, timeoutMs = TIMEOUT_MS }) {
  let res;
  try {
    res = await fetchImpl(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: MAX_TOKENS,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: globalThis.AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return { ok: false, kind: 'network', retryable: true, message: `network: ${err?.name ?? 'error'}` };
  }
  let json;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }
  if (res.status !== 200) {
    const detail = json?.error?.code ?? json?.error?.type ?? '';
    const retryable = res.status === 429 || res.status >= 500;
    return { ok: false, kind: 'http', status: res.status, retryable, message: `HTTP ${res.status}${detail ? ` ${detail}` : ''}` };
  }
  const content = json?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? cleanReply(content) : '';
  if (!text) return { ok: false, kind: 'empty', retryable: true, message: 'empty content' };
  return { ok: true, text };
}

/**
 * Primary model, then fallback. Each model gets TRIES_PER_MODEL tries with backoff on retryable
 * failures; a non-retryable failure (e.g. 403 model access) fails over at once.
 * `unreachable` is true only when every attempt was a network failure.
 */
export async function generate({ baseUrl, apiKey, model, fallbackModel, messages, fetchImpl, sleep, timeoutMs }) {
  const models = [...new Set([model, fallbackModel].filter(Boolean))];
  let last = null;
  let allNetwork = true;
  for (const m of models) {
    for (let i = 0; i < TRIES_PER_MODEL; i += 1) {
      const r = await callOnce({ baseUrl, apiKey, model: m, messages, fetchImpl, timeoutMs });
      if (r.ok) return { ok: true, text: r.text, model: m };
      last = r;
      if (r.kind !== 'network') allNetwork = false;
      if (!r.retryable) break;
      if (i < TRIES_PER_MODEL - 1) await sleep(1000 * 2 ** i);
    }
  }
  return { ok: false, unreachable: allNetwork, message: last?.message ?? 'no attempt' };
}
