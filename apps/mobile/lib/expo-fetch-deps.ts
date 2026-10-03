import { fetch as expoFetch } from 'expo/fetch';
import { apiBaseUrl } from './api-base';
import type { ApiHandlerDeps } from './bridge-handlers-api';
import { getStoredClownSessionToken, setStoredClownSessionToken } from './clown-session-store';

// Network deps for the `api` bridge handler (F2). Kept apart from the DOM
// transport on purpose: expo/fetch streams res.body on iOS and Android, which
// the handler's capped reader requires (RN global fetch exposes no body).
export function createExpoApiDeps(): Pick<ApiHandlerDeps, 'fetch' | 'baseUrl' | 'clownSession'> {
  return {
    fetch: expoFetch as unknown as typeof fetch,
    baseUrl: apiBaseUrl,
    clownSession: { get: getStoredClownSessionToken, set: setStoredClownSessionToken },
  };
}
