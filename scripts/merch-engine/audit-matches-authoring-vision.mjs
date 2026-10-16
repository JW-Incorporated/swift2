import { extractReplacementImage } from './verify-images.mjs';
import { callMerchClaude, fetchClaudeImage } from './merch-claude.mjs';
import {
  AUDIT_TOOL,
  MODEL,
  RETAILER_FETCH_TIMEOUT_MS,
} from './audit-matches-authoring-config.mjs';

export async function retailerOgImage(
  productUrl,
  { fetchImpl = fetch, timeoutMs = RETAILER_FETCH_TIMEOUT_MS } = {},
) {
  if (typeof productUrl !== 'string' || !productUrl) return null;
  const response = await fetchImpl(productUrl, {
    method: 'GET',
    redirect: 'follow',
    signal: globalThis.AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return null;
  const imageUrl = extractReplacementImage(await response.text());
  return typeof imageUrl === 'string' && imageUrl.startsWith('https://') ? imageUrl : null;
}

export async function judgePairWithClaude(pair, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const images = await Promise.all([
    fetchClaudeImage(pair.productImageUrl, { fetchImpl }),
    fetchClaudeImage(pair.momentImageUrl, { fetchImpl }),
  ]);
  return callMerchClaude({
    caller: 'merch-audit-authoring',
    model: MODEL,
    system: 'Judge visual product matches from only the supplied images.',
    user: 'Compare the product image first with the source-moment photo second. Score visual match from 0 to 100 using silhouette, color or pattern, garment type, and notable details. Do not infer details not visible in the images.',
    schema: AUDIT_TOOL.input_schema,
    images,
    ...options,
  });
}
