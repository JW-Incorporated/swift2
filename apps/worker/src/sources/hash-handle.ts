// Hashes a fan handle/username before it's ever written to news_raw_item.author
// — the standing rule for every fan-tier social adapter (bluesky, reddit-rss,
// tumblr): titles/permalinks/timestamps are fine to keep verbatim, an
// individual's raw handle never is (docs/architecture.md's "no bodies, no
// rehosting" rule extends to identity here). SHA-256, truncated to 16 hex
// chars: long enough two different handles never collide in practice, short
// enough it never reads as a real username, and one-way — the point is
// "never store the original," not "reversibly encrypt it," so no salt/key
// management is needed.

import { createHash } from 'node:crypto';

export function hashHandle(handle: string): string {
  return createHash('sha256').update(handle.trim().toLowerCase()).digest('hex').slice(0, 16);
}
