// Deterministic, attribution-preserving selection for the social photo corpus.
// A photo that has been used recently is ranked behind less-used options, but
// never made ineligible: a finite library must still be able to serve a valid
// paired campaign after every entry has appeared.

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validatePhotoEntry(entry) {
  const findings = [];
  if (!entry || typeof entry !== 'object') return ['entry must be an object'];
  if (typeof entry.id !== 'string' || entry.id.trim() === '') findings.push('id is required');
  if (typeof entry.mediaPath !== 'string' || !entry.mediaPath.startsWith('/social/library/photos/')) {
    findings.push('mediaPath must point to /social/library/photos/');
  }
  if (typeof entry.credit !== 'string' || entry.credit.trim() === '') findings.push('credit is required');
  if (!isHttpUrl(entry.source)) findings.push('source must be an http(s) URL');
  return findings;
}

function historyFor(entry, history) {
  return history.filter((record) => record?.photoId === entry.id || record?.media?.includes(entry.mediaPath));
}

function timestamp(value) {
  const valueMs = new Date(value).getTime();
  return Number.isFinite(valueMs) ? valueMs : 0;
}

/**
 * Picks the least-used credited photo, then the longest-unseen, then a stable
 * id tie-breaker. This is deliberately total over a non-empty valid library:
 * reuse improves diversity but can never halt an otherwise valid calendar.
 */
export function selectSocialPhoto(library, history = []) {
  const eligible = library.filter((entry) => validatePhotoEntry(entry).length === 0);
  if (!eligible.length) return null;

  const ranked = eligible
    .map((entry) => {
      const uses = historyFor(entry, history);
      const lastUsedAt = uses.reduce((latest, use) => Math.max(latest, timestamp(use.postedAt)), 0);
      return { entry, useCount: uses.length, lastUsedAt };
    })
    .sort((a, b) => a.useCount - b.useCount || a.lastUsedAt - b.lastUsedAt || a.entry.id.localeCompare(b.entry.id));

  const selected = ranked[0];
  return {
    ...selected.entry,
    reused: selected.useCount > 0,
    useCount: selected.useCount,
    lastUsedAt: selected.lastUsedAt ? new Date(selected.lastUsedAt).toISOString() : null,
  };
}
