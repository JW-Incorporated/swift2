// Awareness lane — the clickable line for a Facebook lead with no post URL
// (#5013, #5015). Pure; no network of any kind (community-engine plan §6): the
// group URL comes from data/communities.json (matched on group name + platform
// Facebook) or, failing that, the weekly-export checklist's group id, and the
// search link is built from the lead's own stored excerpt.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FB_GROUPS_CHECKLIST } from '../knowledge/fb-groups-checklist.mjs';
import { neutralizeMentions } from './discord-delivery.mjs';

const COMMUNITIES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/communities.json',
);
const SEPARATOR = ' — ';
const MAX_EXCERPT_UNITS = 100;
const MAX_QUERY_UNITS = 60;
const MAX_QUERY_WORDS = 6;
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with',
]);
let cachedCommunities = null;

const clipUnits = (text, units) => {
  let out = '';
  for (const ch of text) {
    if (out.length + ch.length > units) break;
    out += ch;
  }
  return out;
};
const oneLine = (text, max) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${clipUnits(flat, max - 1).trimEnd()}\u2026` : flat;
};
const safe = (text) => neutralizeMentions(text);
const escapeLinkBrackets = (text) => text.replace(/[[\]]/g, '\\$&');

/** The Facebook entries of data/communities.json (`[]` if unreadable). */
export function loadFacebookCommunities(file = COMMUNITIES_PATH) {
  if (file === COMMUNITIES_PATH && cachedCommunities) return cachedCommunities;
  let list;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    list = (parsed.communities ?? []).filter(
      (c) => /^facebook$/i.test(c?.platform ?? '') && c?.name && c?.url,
    );
  } catch {
    list = [];
  }
  if (file === COMMUNITIES_PATH) cachedCommunities = list;
  return list;
}

const norm = (value) =>
  String(value ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function groupUrlOf(lead, name, communities, checklist) {
  const slug = /^facebook:(.+)$/.exec(String(lead.community ?? ''))?.[1];
  const label = checklist.find((g) => g.slug === slug)?.label;
  const names = [lead.community, name, label].map(norm).filter(Boolean);
  const hit = communities.find((c) => names.includes(norm(c.name)));
  if (hit) return hit.url.endsWith('/') ? hit.url : `${hit.url}/`;
  const groupId = checklist.find((g) => g.slug === slug)?.groupId;
  return groupId ? `https://www.facebook.com/groups/${encodeURIComponent(groupId)}/` : null;
}

function distinctiveQuery(excerpt) {
  const words = excerpt.match(/[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*/gu) ?? [];
  const distinctive = words.filter((word) => !STOPWORDS.has(word.toLowerCase()));
  return oneLine(
    (distinctive.length ? distinctive : words).slice(0, MAX_QUERY_WORDS).join(' '),
    MAX_QUERY_UNITS,
  );
}

/** A post permalink when present, otherwise the best group-scoped search URL available. */
export function facebookLeadUrl(
  lead,
  { communities = loadFacebookCommunities(), checklist = FB_GROUPS_CHECKLIST } = {},
) {
  if (lead.url) return lead.url;
  const locator = safe(lead.locator).trim();
  const cut = locator.indexOf(SEPARATOR);
  const name = cut === -1 ? '' : locator.slice(0, cut).trim();
  const excerpt = cut === -1 ? locator : locator.slice(cut + SEPARATOR.length);
  const groupUrl = groupUrlOf(lead, name, communities, checklist);
  const query = distinctiveQuery(excerpt);
  return groupUrl && query ? `${groupUrl}search/?q=${encodeURIComponent(query)}` : null;
}

/**
 * `Find it in: [Group](<group url>) — excerpt · [search](<group search url>)`,
 * or null when the group's URL is unknown (the caller keeps the plain locator).
 */
export function facebookFallbackLine(
  lead,
  { communities = loadFacebookCommunities(), checklist = FB_GROUPS_CHECKLIST } = {},
) {
  const locator = safe(lead.locator).trim();
  const cut = locator.indexOf(SEPARATOR);
  const name = cut === -1 ? '' : locator.slice(0, cut).trim();
  const excerpt = oneLine(
    cut === -1 ? locator : locator.slice(cut + SEPARATOR.length),
    MAX_EXCERPT_UNITS,
  );
  const groupUrl = groupUrlOf(lead, name, communities, checklist);
  if (!groupUrl) return null;
  const label = escapeLinkBrackets(oneLine(name || safe(lead.community), 80)) || 'the group';
  const searchUrl = facebookLeadUrl(lead, { communities, checklist });
  const search = searchUrl ? ` · [search](<${searchUrl}>)` : '';
  return `Find it in: [${label}](<${groupUrl}>)${excerpt ? ` — ${escapeLinkBrackets(excerpt)}` : ''}${search}`;
}
