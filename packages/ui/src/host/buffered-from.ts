import type { ApiFetch } from '@swift2/content';

import type { ApiStream } from './types';

/** Fallback `ApiStream` for hosts without one: awaits `apiFetch` and yields the whole body once. */
export function bufferedFrom(apiFetch: ApiFetch): ApiStream {
  return async function* buffered(req, opts) {
    const res = await apiFetch(req, opts);
    if (res.status < 200 || res.status >= 300) throw new Error(String(res.status));
    yield res.body;
  };
}
