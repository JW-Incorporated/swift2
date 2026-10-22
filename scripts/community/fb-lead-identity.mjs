import { createHash } from 'node:crypto';

const LOCATOR_HASH_LENGTH = 20;
export const LEGACY_LOCATOR_HASH_SALT = 'longlive-fb-lead-v1';
const LEGACY_LOCATOR = Symbol('facebookLegacyLocator');

function shortHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, LOCATOR_HASH_LENGTH);
}

function normalizedText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(
      /\b\d[\d,]*(?:\.\d+)?\s*[KkMm]?\s*(?:reactions?|likes?|comments?|repl(?:y|ies)|shares?)\b/gi,
      ' ',
    )
    .replace(
      /\b(?:just now|yesterday|\d+\s*(?:m(?:in(?:ute)?s?)?|h(?:ou)?rs?|d(?:ays?)?|w(?:eeks?)?)(?:\s+ago)?)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizedTimestamp(post) {
  const value = post.timestamp ?? post.ownTimestamp ?? post.createdAt ?? post.publishedAt ?? '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  return String(value).trim().toLowerCase();
}

function stablePostDiscriminator(post) {
  // A timestamp-less post can only be separated when the parser supplies a position-independent
  // DOM identifier. With none, identical normalized text intentionally collapses; never use index.
  const value =
    post.postId ?? post.domPostId ?? post.domId ?? post.idFragment ?? post.stableId ?? '';
  return String(value).trim().toLowerCase();
}

function locatorIdentity(post, groupId) {
  const timestamp = normalizedTimestamp(post);
  const discriminator = timestamp ? '' : stablePostDiscriminator(post);
  const textHash = shortHash(normalizedText(post.text));
  return `${String(groupId).trim().toLowerCase()}\0${timestamp}\0${discriminator}\0${textHash}`;
}

/** Pre-P1-16b locator, retained only to find and upgrade existing rows in place. */
export function unsaltedLegacyLeadLocator(post, groupId) {
  const textHash = shortHash(normalizedText(post.text));
  const identity = `${String(groupId).trim().toLowerCase()}\0${normalizedTimestamp(post)}\0${textHash}`;
  return `Facebook post h-${shortHash(identity)}`;
}

/** Stable v1 identity: dynamic count/age chrome is removed and no source text is retained. */
export function legacyLeadLocator(post, groupId) {
  return `Facebook post h-${shortHash(`${LEGACY_LOCATOR_HASH_SALT}\0${locatorIdentity(post, groupId)}`)}`;
}

/** Schema-v2 identity keeps the useful post id while truncating only the display-name prefix. */
export function permalinkLeadLocator(permalink, groupName) {
  const postId = /\/posts\/([^/]+)/.exec(String(permalink))?.[1];
  const key = postId && postId.length <= 40 ? postId : `p-${shortHash(String(permalink))}`;
  const suffix = `Facebook post ${key}`;
  const prefix = [...String(groupName ?? '')]
    .slice(0, Math.max(0, 77 - [...suffix].length))
    .join('');
  return prefix ? `${prefix} — ${suffix}` : suffix;
}

/** Attach the v1 lookup key without adding a column to the database payload or dry-run JSON. */
export function attachLegacyLocator(lead, ...locators) {
  Object.defineProperty(lead, LEGACY_LOCATOR, { value: locators });
  return lead;
}

export function legacyLocatorOf(lead) {
  return lead[LEGACY_LOCATOR]?.[0] ?? lead.locator;
}

export function legacyLocatorsOf(lead) {
  return lead[LEGACY_LOCATOR] ?? [lead.locator];
}
