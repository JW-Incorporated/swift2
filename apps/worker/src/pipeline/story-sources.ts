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

export interface StorySourceCandidate {
  storyId: string;
  rawItemId: string | null;
  externalId?: string | null;
  outletName: string;
  publisherUrl?: string | null;
  articleUrl: string;
  url: string;
  tier: SourceTier;
  existingId?: string;
  storedOutletName?: string;
}

export interface StorySourcePlan {
  rows: {
    story_id: string;
    raw_item_id: string | null;
    outlet_name: string;
    url: string;
    tier: SourceTier;
  }[];
  deleteIds: string[];
}

function normalizedHost(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  try {
    let host = new URL(raw).hostname.toLowerCase();
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

/** Stable story-level outlet identity across casing, leading "The", domains, and mobile hosts. */
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

function canonicalArticleUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    const host = normalizedHost(raw);
    if (!host) return undefined;
    let path = url.pathname.replace(/\/+$/, '').replace(/\/(?:amp|amp\/index\.html)$/i, '');
    path = path.replace(/\.amp(?:\.html)?$/i, '.html');
    return `${host}${path || '/'}`.toLowerCase();
  } catch {
    return undefined;
  }
}

function identityTokens(candidate: StorySourceCandidate): Set<string> {
  const tokens = new Set<string>();
  const externalId = candidate.externalId?.trim();
  if (externalId) tokens.add(`external:${externalId.toLocaleLowerCase('en-US')}`);
  const url = canonicalArticleUrl(candidate.articleUrl);
  if (url) tokens.add(`url:${url}`);
  if (tokens.size === 0 && candidate.rawItemId) tokens.add(`raw:${candidate.rawItemId}`);
  return tokens;
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

function better<T extends StorySourceCandidate>(a: T, b: T): T {
  const tierDelta = TIER_RANK[a.tier] - TIER_RANK[b.tier];
  if (tierDelta !== 0) return tierDelta > 0 ? a : b;
  const urlDelta = urlRank(a.url) - urlRank(b.url);
  if (urlDelta !== 0) return urlDelta > 0 ? a : b;
  if (a.existingId !== undefined && b.existingId === undefined) return a;
  if (b.existingId !== undefined && a.existingId === undefined) return b;
  return a.url.localeCompare(b.url) <= 0 ? a : b;
}

/** One plan for both persistence and verification: article first, then normalized outlet. */
export function planStorySources(candidates: StorySourceCandidate[]): StorySourcePlan {
  const normalized = candidates.map((candidate) => ({
    ...candidate,
    outletName: normalizeOutletName(
      candidate.outletName,
      candidate.publisherUrl,
      candidate.articleUrl,
    ),
    tokens: identityTokens(candidate),
  }));
  const articleGroups: typeof normalized[] = [];
  for (const candidate of normalized) {
    const matching = articleGroups.filter(
      (members) =>
        members[0]?.storyId === candidate.storyId &&
        members.some((member) => [...candidate.tokens].some((token) => member.tokens.has(token))),
    );
    if (matching.length === 0) {
      articleGroups.push([candidate]);
    } else {
      const merged = [candidate, ...matching.flat()];
      for (const group of matching) articleGroups.splice(articleGroups.indexOf(group), 1);
      articleGroups.push(merged);
    }
  }

  const articleWinners = articleGroups.map((members) => members.reduce(better));
  const outletGroups = new Map<string, StorySourceCandidate[]>();
  for (const winner of articleWinners) {
    const key = `${winner.storyId}::${winner.outletName.toLocaleLowerCase('en-US')}`;
    const group = outletGroups.get(key) ?? [];
    group.push(winner);
    outletGroups.set(key, group);
  }
  const winners = [...outletGroups.values()].map((members) => members.reduce(better));
  const keptExistingIds = new Set<string>();
  for (const winner of winners) {
    const keep = normalized.find(
      (candidate) =>
        candidate.existingId &&
        candidate.storyId === winner.storyId &&
        candidate.storedOutletName === winner.outletName,
    )?.existingId;
    if (keep) keptExistingIds.add(keep);
  }

  return {
    rows: winners.map((winner) => ({
      story_id: winner.storyId,
      raw_item_id: winner.rawItemId,
      outlet_name: winner.outletName,
      url: winner.url,
      tier: winner.tier,
    })),
    deleteIds: normalized
      .flatMap((candidate) => (candidate.existingId ? [candidate.existingId] : []))
      .filter((id) => !keptExistingIds.has(id)),
  };
}

export function storyVerification(candidates: StorySourceCandidate[]): {
  status: VerificationStatus;
  sourceCount: number;
} {
  const rows = planStorySources(candidates).rows;
  return {
    status: computeVerificationStatus(rows.map((row) => ({ tier: row.tier }))),
    sourceCount: rows.length,
  };
}
