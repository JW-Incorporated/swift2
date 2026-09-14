// GitHub REST on the doorbell's key (`longlive-doorbell-dispatch`, Actions:
// read and write on swift2). Never throws and never logs the key: resolves
// `{ ok, status, data }`, with `status` naming a network failure.
export const REQUEST_TIMEOUT_MS = 15_000;

export async function githubRequest({ method = 'GET', url, body }, token, { fetchImpl = fetch } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'longlive-doorbell',
  };
  if (body !== undefined) headers['content-type'] = 'application/json';
  try {
    const res = await fetchImpl(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    let data = null;
    let readable = true;
    if (res.status !== 204) {
      try { data = await res.json(); } catch { readable = false; }
    }
    return { ok: res.ok && readable, status: res.status, data, date: res.headers?.get?.('date') ?? null };
  } catch (err) {
    return { ok: false, status: `network error (${err.message})`, data: null };
  }
}
