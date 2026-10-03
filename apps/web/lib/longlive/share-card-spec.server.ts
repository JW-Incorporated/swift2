import 'server-only';
import { getContentItemByIdOrSlug } from './content';
import { parseShareCardRequest, type ShareCardRequest } from './share-card-spec';

/** The share-card route's entry: card specs resolved against the module content data (server only). */
export function parseShareCardRequestFromModules(url: URL): ShareCardRequest {
  return parseShareCardRequest(url, { getContentItemByIdOrSlug });
}
