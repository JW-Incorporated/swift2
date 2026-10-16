import { verifyImage } from './verify-images.mjs';

export async function defaultVerifyUrl(url, { fetchImpl = fetch } = {}) {
  if (!url) return { verdict: 'invalid', status: null };
  try {
    const response = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
    if (response.ok) return { verdict: 'ok', status: response.status };
    if ([404, 410].includes(response.status)) return { verdict: 'invalid', status: response.status };
    return { verdict: 'unavailable', status: response.status };
  } catch (error) {
    return { verdict: 'unavailable', status: null, reason: error?.message || String(error) };
  }
}

function verificationPassed(result) {
  return result === true || result?.verdict === 'ok';
}

/**
 * Reusable E1/E2 filter for callers that need an early receipt. P1-19's
 * product writer is the final pre-merge authority and re-runs both gates.
 */
export async function verifyAndScoreCandidates(
  candidates,
  {
    momentImageUrl,
    judge,
    verifyUrlImpl = defaultVerifyUrl,
    verifyImageImpl = verifyImage,
    fetchImpl = fetch,
  },
) {
  const scored = [];
  for (const candidate of candidates) {
    const urlVerification = await verifyUrlImpl(candidate.productUrl, { fetchImpl });
    const imageVerified = candidate.imageUrl
      ? (await verifyImageImpl(candidate.imageUrl, { fetchImpl })).verdict === 'ok'
      : false;
    if (!verificationPassed(urlVerification) || !imageVerified) continue;
    const judgment = await judge({ candidate, momentImageUrl });
    if (!Number.isFinite(judgment?.score)) continue;
    scored.push({ ...candidate, urlVerified: true, imageVerified, score: judgment.score });
  }
  return scored;
}
