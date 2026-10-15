export async function verifyProductUrl(url, { fetchImpl = fetch } = {}) {
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

export function verificationPassed(result) {
  return result === true || result?.verdict === 'ok';
}
