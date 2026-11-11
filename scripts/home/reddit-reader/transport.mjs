import { CircuitTripError, tripCircuit } from './breaker.mjs';

export const REDDIT_USER_AGENT = 'LongLiveTS-reader/1.0 (+https://www.longlivets.com)';

function httpError(url, status) {
  const error = new Error(`Reddit request failed: HTTP ${status} for ${url}`);
  error.status = status;
  return error;
}

export function createRedditTransport({
  circuitFile,
  pacer,
  fetchImpl = fetch,
  userAgent = REDDIT_USER_AGENT,
  now = () => new Date(),
  onStatus = () => {},
} = {}) {
  if (!circuitFile) throw new Error('circuitFile is required');
  if (!pacer) throw new Error('pacer is required');

  async function request(url, accept) {
    await pacer.beforeRequest();
    const response = await fetchImpl(url, {
      headers: { Accept: accept, 'User-Agent': userAgent },
      redirect: 'follow',
    });
    onStatus({ url: String(url), status: response.status });
    if (response.status === 403 || response.status === 429) {
      const reason = `blocked response from ${new URL(url).hostname}`;
      await tripCircuit(circuitFile, reason, { status: response.status, now: now() });
      throw new CircuitTripError(reason, response.status);
    }
    if (!response.ok) throw httpError(url, response.status);
    return response;
  }

  return {
    async rss(url) {
      const response = await request(url, 'application/atom+xml, application/xml;q=0.9');
      return response.text();
    },
    async json(url) {
      const response = await request(url, 'application/json');
      const contentType = response.headers.get('content-type') ?? '';
      if (!/\b(?:application|text)\/[^;]*json\b/i.test(contentType)) {
        const reason = `non-JSON response (${contentType || 'missing content-type'})`;
        await tripCircuit(circuitFile, reason, { now: now() });
        throw new CircuitTripError(reason);
      }
      try {
        return await response.json();
      } catch {
        const reason = 'invalid JSON response';
        await tripCircuit(circuitFile, reason, { now: now() });
        throw new CircuitTripError(reason);
      }
    },
  };
}
