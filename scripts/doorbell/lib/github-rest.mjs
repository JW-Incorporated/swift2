// GitHub REST on the doorbell's key (`longlive-doorbell-dispatch`, Actions:
// read and write on swift2). Never throws and never logs the key: resolves
// `{ ok, status, data }`, with `status` naming a network failure. Every request
// has a deadline, so one slow call never stalls the doorbell or the clock.
export const REQUEST_TIMEOUT_MS = 15_000;

export async function githubRequest({ method = 'GET', url, body }, token, { fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'longlive-doorbell',
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  try {
    const res = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: globalThis.AbortSignal.timeout(timeoutMs) });
    let data = null;
    if (res.status !== 204) data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: `network error (${err.message})`, data: null };
  }
}
