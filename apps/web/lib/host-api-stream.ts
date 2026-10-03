import type { ApiStream } from '@swift2/ui';

/** Web root `apiStream`: same-origin `fetch`, body read progressively (no buffering). Cancels the reader when the consumer stops or the signal aborts. */
export const webApiStream: ApiStream = async function* webApiStream(req, opts) {
  const res = await fetch(req.path, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    ...(opts?.signal ? { signal: opts.signal } : {}),
  });
  if (!res.ok) throw new Error(String(res.status));
  if (!res.body) {
    yield await res.text();
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) {
        const text = decoder.decode(value, { stream: true });
        if (text) yield text;
      }
      if (done) break;
    }
    const tail = decoder.decode();
    if (tail) yield tail;
  } finally {
    await reader.cancel().catch(() => {});
  }
};
