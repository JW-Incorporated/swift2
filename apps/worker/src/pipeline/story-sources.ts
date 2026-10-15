import {
  computeVerificationStatus,
  lookupOutletTier,
  type SourceTier,
  type VerificationStatus,
} from '@swift2/shared/news';

const TIER_RANK: Record<SourceTier, number> = {
  unverified: 0,
  fan: 1,
  established: 2,
  official: 3,
};

const IDENTIFYING_QUERY_KEYS = new Set([
  'v',
  'id',
  'p',
  'story',
  'article',
  'a',
  'sid',
  'newsid',
  'storyid',
  'itemid',
]);
const UNKNOWN_OUTLET_KEY = 'unknown:';

export interface StorySourceCandidate {
  storyId: string;
  rawItemId: string | null;
  externalId?: string | null;
  title?: string | null;
  snippet?: string | null;
  author?: string | null;
  sourceType?: string;
  outletName: string;
  publisherUrl?: string | null;
  articleUrl: string;
  url: string;
  tier: SourceTier;
  existingId?: string;
  storedOutletName?: string;
}

export interface StorySourceRow {
  story_id: string;
  raw_item_id: string | null;
  outlet_name: string;
  url: string;
  tier: SourceTier;
}

export interface StorySourcePlan {
  rows: StorySourceRow[];
  deleteCandidates: { id: string; story_id: string; outlet_name: string }[];
}

function normalizedHost(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    let host = new URL(raw).hostname.toLocaleLowerCase('en-US');
    while (/^(?:www|amp|m|mobile)\./.test(host)) host = host.replace(/^[^.]+\./, '');
    return host || undefined;
  } catch {
    return undefined;
  }
}

function displayName(raw: string): string {
  const clean = raw
    .trim()
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
  return clean.replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('en-US'));
}

/** Returns a stable display identity for names that have no usable publisher URL. */
export function normalizeOutletName(
  name: string,
  publisherUrl?: string | null,
  articleUrl?: string,
): string {
  const articleHost = normalizedHost(articleUrl);
  const host = normalizedHost(publisherUrl) ??
    (articleHost === 'news.google.com' ? undefined : articleHost);
  const known = host ? lookupOutletTier(host) : undefined;
  if (known) return known.name.replace(/^The\s+/i, '');
  if (host) return host;
  const nameHost = name.includes('.')
    ? normalizedHost(/^https?:\/\//i.test(name) ? name : `https://${name}`)
    : undefined;
  const knownName = nameHost ? lookupOutletTier(nameHost) : undefined;
  return knownName?.name.replace(/^The\s+/i, '') ?? nameHost ?? displayName(name);
}

/** Canonical article identity: stable host/path plus sorted identifying parameters only. */
export function canonicalArticleUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    const host = normalizedHost(raw);
    if (!host) return undefined;
    let path = url.pathname.replace(/\/+$/, '').replace(/\/(?:amp|amp\/index\.html)$/i, '');
    path = path.replace(/\.amp(?:\.html)?$/i, '.html');
    const identifying = [...url.searchParams]
      .filter(([key]) => IDENTIFYING_QUERY_KEYS.has(key.toLocaleLowerCase('en-US')))
      .map(([key, value]): [string, string] => [key.toLocaleLowerCase('en-US'), value])
      .sort(([aKey, aValue], [bKey, bValue]) =>
        aKey.localeCompare(bKey) || aValue.localeCompare(bValue),
      );
    const query = new URLSearchParams(identifying).toString();
    return `${host}${path || '/'}${query ? `?${query}` : ''}`;
  } catch {
    return undefined;
  }
}

function normalizedTitle(raw?: string | null): string | undefined {
  const normalized = raw
    ?.trim()
    .replace(/^(?:AP|Reuters|AFP)\s*:\s*/i, '')
    .replace(/\s+(?:-|\|)\s+[^-|]+$/u, '')
    .toLocaleLowerCase('en-US')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || undefined;
}

function wireService(candidate: StorySourceCandidate): string | undefined {
  const prefix = candidate.title?.match(/^\s*(AP|Reuters|AFP)\s*:/i)?.[1];
  if (prefix) return prefix.toLocaleLowerCase('en-US');
  const credit = [candidate.author, candidate.snippet].filter(Boolean).join(' ');
  if (/\bReuters\b/i.test(credit)) return 'reuters';
  if (/\b(?:AFP|Agence France-Presse)\b/i.test(credit)) return 'afp';
  if (/\b(?:Associated Press|AP News)\b/i.test(credit) || /(?:^|[\s,(])AP(?:$|[\s,)])/i.test(credit)) {
    return 'ap';
  }
  return undefined;
}

function identityTokens(candidate: StorySourceCandidate): Set<string> {
  const tokens = new Set<string>();
  const externalId = candidate.externalId?.trim();
  if (externalId) tokens.add(`external:${externalId}`);
  const url = canonicalArticleUrl(candidate.articleUrl);
  if (url) tokens.add(`url:${url}`);
  const title = normalizedTitle(candidate.title);
  if (title) tokens.add(`title:${title}`);
  const wire = wireService(candidate);
  if (wire) tokens.add(`wire:${wire}`);
  if (tokens.size === 0 && candidate.rawItemId) tokens.add(`raw:${candidate.rawItemId}`);
  return tokens;
}

function outletMatchKey(candidate: StorySourceCandidate): string {
  const articleHost = normalizedHost(candidate.articleUrl);
  const publisherHost = normalizedHost(candidate.publisherUrl);
  if (
    !publisherHost &&
    (candidate.sourceType === 'google_news' || articleHost === 'news.google.com')
  ) {
    return UNKNOWN_OUTLET_KEY;
  }
  const host = publisherHost ?? articleHost;
  if (host) return `host:${host}`;
  return `name:${normalizeOutletName(candidate.outletName).toLocaleLowerCase('en-US')}`;
}

function publisherDisplayName(candidate: StorySourceCandidate, outletKey: string): string {
  if (outletKey === UNKNOWN_OUTLET_KEY) return 'unknown';
  return candidate.outletName.trim().replace(/\s+/g, ' ') || 'unknown';
}

function urlRank(raw: string): number {
  try {
    const url = new URL(raw);
    const direct = normalizedHost(raw) === 'news.google.com' ? 0 : 4;
    const secure = url.protocol === 'https:' ? 2 : 0;
    const canonicalHost = /^(?:www|amp|m|mobile)\./i.test(url.hostname) ? 0 : 1;
    return direct + secure + canonicalHost;
  } catch {
    return 0;
  }
}

type NormalizedCandidate = StorySourceCandidate & { outletKey: string; tokens: Set<string> };

function betterCandidate(a: NormalizedCandidate, b: NormalizedCandidate): NormalizedCandidate {
  const knownDelta = Number(a.outletKey !== UNKNOWN_OUTLET_KEY) -
    Number(b.outletKey !== UNKNOWN_OUTLET_KEY);
  if (knownDelta !== 0) return knownDelta > 0 ? a : b;
  const tierDelta = TIER_RANK[a.tier] - TIER_RANK[b.tier];
  if (tierDelta !== 0) return tierDelta > 0 ? a : b;
  const urlDelta = urlRank(a.url) - urlRank(b.url);
  if (urlDelta !== 0) return urlDelta > 0 ? a : b;
  if (a.existingId !== undefined && b.existingId === undefined) return a;
  if (b.existingId !== undefined && a.existingId === undefined) return b;
  return a.url.localeCompare(b.url) <= 0 ? a : b;
}

function sourceWinners(candidates: StorySourceCandidate[]): NormalizedCandidate[] {
  const normalized = candidates.map((candidate) => ({
    ...candidate,
    outletKey: outletMatchKey(candidate),
    tokens: identityTokens(candidate),
  }));
  const articleGroups: NormalizedCandidate[][] = [];
  for (const candidate of normalized) {
    const matching = articleGroups.filter(
      (members) => members[0]?.storyId === candidate.storyId &&
        members.some((member) => [...candidate.tokens].some((token) => member.tokens.has(token))),
    );
    if (matching.length === 0) {
      articleGroups.push([candidate]);
      continue;
    }
    for (const group of matching) articleGroups.splice(articleGroups.indexOf(group), 1);
    articleGroups.push([candidate, ...matching.flat()]);
  }

  const outlets = new Map<string, NormalizedCandidate[]>();
  for (const winner of articleGroups.map((members) => members.reduce(betterCandidate))) {
    const key = `${winner.storyId}\u0000${winner.outletKey}`;
    outlets.set(key, [...(outlets.get(key) ?? []), winner]);
  }
  return [...outlets.values()].map((members) => members.reduce(betterCandidate));
}

export function storySourceConflictKey(row: { story_id: string; outlet_name: string }): string {
  return `${row.story_id}\u0000${row.outlet_name}`;
}

export function collapseStorySourceRows(rows: StorySourceRow[]): StorySourceRow[] {
  const winners = new Map<string, StorySourceRow>();
  for (const row of rows) {
    const key = storySourceConflictKey(row);
    const current = winners.get(key);
    const preferred = !current || TIER_RANK[row.tier] > TIER_RANK[current.tier] ||
      (row.tier === current.tier && (urlRank(row.url) > urlRank(current.url) ||
        (urlRank(row.url) === urlRank(current.url) && row.url.localeCompare(current.url) < 0)));
    if (preferred) winners.set(key, row);
  }
  return [...winners.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
}

/** Plans article/outlet winners; persistence performs the final DB-conflict collapse. */
export function planStorySources(candidates: StorySourceCandidate[]): StorySourcePlan {
  const winners = sourceWinners(candidates);
  const keptIds = new Set(
    winners.flatMap((winner) => {
      const display = publisherDisplayName(winner, winner.outletKey);
      return winner.existingId && winner.storedOutletName === display ? [winner.existingId] : [];
    }),
  );
  return {
    rows: winners.map((winner) => ({
      story_id: winner.storyId,
      raw_item_id: winner.rawItemId,
      outlet_name: publisherDisplayName(winner, winner.outletKey),
      url: winner.url,
      tier: winner.tier,
    })),
    deleteCandidates: candidates.flatMap((candidate) =>
      candidate.existingId && !keptIds.has(candidate.existingId)
        ? [{
            id: candidate.existingId,
            story_id: candidate.storyId,
            outlet_name: candidate.storedOutletName ?? candidate.outletName,
          }]
        : [],
    ),
  };
}

export function storyVerification(candidates: StorySourceCandidate[]): {
  status: VerificationStatus;
  sourceCount: number;
} {
  const rows = collapseStorySourceRows(
    sourceWinners(candidates)
      .filter((candidate) => candidate.outletKey !== UNKNOWN_OUTLET_KEY)
      .map((candidate) => ({
        story_id: candidate.storyId,
        raw_item_id: candidate.rawItemId,
        outlet_name: publisherDisplayName(candidate, candidate.outletKey),
        url: candidate.url,
        tier: candidate.tier,
      })),
  );
  return { status: computeVerificationStatus(rows), sourceCount: rows.length };
}
