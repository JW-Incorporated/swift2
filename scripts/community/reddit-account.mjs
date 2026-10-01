// Reddit thread links Tree puts in Discord carry the committed
// `redditLinkParams` (incl. `target_user=<brand account>`) so Reddit switches
// the owner to that account before he replies, like Reddit's own email links.
// Pure; reads only committed config.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'reddit-account.json');
const REDDIT_HOSTS = new Set(['reddit.com', 'www.reddit.com', 'old.reddit.com', 'new.reddit.com']);
const THREAD_PATH_RE = /^(\/r\/[^/]+)?\/comments\/[^/]+/i;

const CONFIG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
export const REDDIT_REPLY_ACCOUNT = CONFIG.redditReplyAccount;
export const REDDIT_LINK_PARAMS = CONFIG.redditLinkParams ?? {};

/**
 * Sets every configured param on a Reddit thread/comment URL, preserving all
 * other params; idempotent. Non-Reddit, non-thread, or malformed input comes
 * back unchanged.
 */
export function withReplyAccount(url, params = REDDIT_LINK_PARAMS) {
  const entries = Object.entries(params ?? {});
  if (typeof url !== 'string' || entries.length === 0) return url;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return url;
  }
  if (!/^https?:$/.test(parsed.protocol)) return url;
  if (!REDDIT_HOSTS.has(parsed.hostname.toLowerCase())) return url;
  if (!THREAD_PATH_RE.test(parsed.pathname)) return url;
  if (entries.every(([k, v]) => parsed.searchParams.get(k) === String(v))) return url.trim();
  for (const [k, v] of entries) parsed.searchParams.set(k, String(v));
  return parsed.toString();
}

export function replyAsLine(account = REDDIT_REPLY_ACCOUNT) {
  return `↪️ Reply as u/${account}`;
}
