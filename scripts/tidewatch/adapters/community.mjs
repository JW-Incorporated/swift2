import { createHash } from 'node:crypto';
import { watchCandidate } from '../fingerprint.mjs';

function slug(value) {
  return String(value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function mapLead(row) {
  if (!['reddit', 'facebook'].includes(row.platform)) throw new Error(`unsupported engagement platform: ${row.platform}`);
  const fallback = createHash('sha1').update(row.locator ?? row.id).digest('hex');
  const itemKey = row.platform === 'facebook'
    ? `fb:${slug(row.community)}:${row.thread_id ?? fallback}`
    : `lead:reddit:${row.thread_id ?? fallback}`;
  return watchCandidate({
    itemKey,
    cursorKey: row.id,
    source: row.platform,
    sourceRef: row.id,
    url: row.url,
    title: row.title ?? `${row.kind} in ${row.community}`,
    excerpt: row.platform === 'facebook' ? null : row.context,
    detectedAt: row.created_at,
  });
}

export function mapTheory(row) {
  return watchCandidate({
    itemKey: `theory:${row.theory_key}`,
    cursorKey: row.id,
    source: 'theory',
    sourceRef: row.id,
    url: row.sample_urls?.[0],
    title: row.claim,
    excerpt: row.evidence_summary ?? row.claim,
    detectedAt: row.created_at,
  });
}
