import type { ImageKind } from '@swift2/experience';

// Anything that isn't the real photo of THIS moment gets an explicit label —
// a stand-in must never read as the real thing. 'primary' renders no badge.
export const IMAGE_KIND_BADGE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference',
  archival: 'Archival',
};
export const IMAGE_KIND_NOTE: Record<Exclude<ImageKind, 'primary'>, string> = {
  reference: 'For reference — the real photo hasn’t surfaced yet.',
  archival: 'Archival.',
};

// Hotlinked gallery/hero urls bypass Next's image optimizer (whose
// remotePatterns allowlist covers only YouTube posters); local era art and
// curated assets keep the optimized path.
export const isRemoteUrl = (url: string) => /^https?:\/\//.test(url);
