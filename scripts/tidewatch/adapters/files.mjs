import { createHash } from 'node:crypto';
import { normalizeUrl, watchCandidate } from '../fingerprint.mjs';

function stableId(value) {
  return createHash('sha1').update(String(value)).digest('hex');
}

export function mapMerch(row, kind, changedAt) {
  const normalized = normalizeUrl(row.url) ?? row.url;
  const evidenceId = row.provenance?.find((entry) => entry?.e1?.productId)?.e1?.productId;
  const id = kind === 'official' ? normalized : evidenceId ?? stableId(normalized);
  return watchCandidate({
    itemKey: `merch:${kind}:${id}`,
    source: 'merch',
    sourceRef: row.sourceId ?? evidenceId ?? id,
    url: row.url,
    title: row.item,
    excerpt: `${row.brand ?? ''} · ${row.retailer ?? ''}`,
    detectedAt: changedAt ?? row.discoveredAt,
  });
}

export function mapSocialPost(row, filename) {
  const id = row.platformPostId ?? filename.replace(/\.json$/i, '');
  return watchCandidate({
    itemKey: `post:${row.platform}:${id}`,
    source: 'social',
    sourceRef: id,
    url: row.url,
    title: row.campaign ?? row.body?.split('\n')[0] ?? filename,
    excerpt: row.body,
    detectedAt: row.postedAt ?? row.scheduledAt,
  });
}

export function mapReply([id, detectedAt]) {
  const [prefix, ...rest] = id.split(':');
  const platform = prefix.startsWith('fb-') ? 'facebook' : 'instagram';
  return watchCandidate({
    itemKey: `reply:${platform}:${rest.join(':')}`,
    source: 'social',
    sourceRef: id,
    title: `${platform} ${prefix.replace('-', ' ')}`,
    detectedAt,
  });
}

export function mapMoment(row, eraSlug, changedAt) {
  return watchCandidate({
    itemKey: `moment:${row.slug}`,
    source: 'moment',
    sourceRef: `${eraSlug}:${row.slug}`,
    url: row.sourceUrl,
    title: row.title,
    excerpt: row.snippet,
    detectedAt: changedAt,
  });
}
