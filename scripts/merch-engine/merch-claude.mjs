import { callClaude } from '../lib/claude-call.mjs';

export const MERCH_VISION_MODEL = 'claude-sonnet-5-5';
export const MERCH_LIGHT_MODEL = 'claude-haiku-5-5';
export const MERCH_PRIORITY = 'P3';
// The former $3 cap allowed floor($3 / $0.03408) = 88 reserved calls.
export const MERCH_CALLER_CAP = 88;
const IMAGE_FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function imageFailure(message, status = null) {
  const error = new Error(status ? `image source ${message} (HTTP ${status})` : `image source ${message}`);
  error.code = message;
  error.status = status;
  return error;
}

export async function fetchClaudeImage(url, { fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(url, { method: 'GET', redirect: 'follow',
      signal: globalThis.AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
  } catch {
    throw imageFailure('unavailable');
  }
  if (!response.ok) throw imageFailure('unavailable', response.status);
  const mimeType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (!SUPPORTED_IMAGE_MEDIA_TYPES.has(mimeType)) throw imageFailure('unsupported');
  const declaredSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) throw imageFailure('too large');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw imageFailure('too large');
  return { buffer, mimeType };
}

export async function callMerchClaude({
  caller, model, system, user, schema, imageUrls = [], images: suppliedImages,
  call = callClaude, fetchImpl = fetch, log = console.error,
}) {
  const images = suppliedImages ?? await Promise.all(
    imageUrls.map((url) => fetchClaudeImage(url, { fetchImpl })),
  );
  const outcome = await call({ caller, priority: MERCH_PRIORITY, model, system, user, schema,
    images, maxCalls: MERCH_CALLER_CAP });
  if (outcome?.status === 'ok') return outcome.data;
  const status = outcome?.status ?? 'unavailable';
  const reason = outcome?.reason ?? 'Claude subscription unavailable';
  log(`${caller}: holding candidate (${status}: ${reason})`);
  return null;
}
