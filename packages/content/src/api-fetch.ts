/**
 * `ApiFetch` — the reader's one transport seam for `/api/*` (One UI, WP0.3b/X1).
 *
 * Both shapes are plain JSON so they can cross a postMessage bridge: the app's
 * DOM host (a `file://` page, opaque `null` origin) cannot call `/api` directly
 * (it is deliberately not CORS-enabled), so WP2.1/2.3 implement the app side
 * as bridge -> native fetch. On the web the default below is a same-origin
 * `fetch`. Reader call sites are NOT migrated onto this yet.
 */
export type ApiRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: `/api/${string}`;
  headers?: Record<string, string>;
  body?: string;
};

export type ApiResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type ApiFetchOptions = { signal?: AbortSignal };

export type ApiFetch = (req: ApiRequest, opts?: ApiFetchOptions) => Promise<ApiResponse>;

/** Web default: same-origin `fetch`, flattened to the bridge-serializable response shape. */
export const webApiFetch: ApiFetch = async (req, opts) => {
  const res = await fetch(req.path, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    ...(opts?.signal ? { signal: opts.signal } : {}),
  });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return { status: res.status, headers, body: await res.text() };
};
