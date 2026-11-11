// Media gate for `live_theory` (owner rule: every published card carries an
// image). Reuses @swift2/shared's `evaluateImageUrl` — the same image
// validation `evaluateCurrentItemQuality` applies to current_item — so there
// is exactly one allowlist and one verdict shape. A theory whose evidence has
// no passing image is written HELD (image_url null + quality_hold_reason);
// the anon RLS policy (20261029000000_live_theory_image.sql) and the web/UI
// read filters all refuse a row without a valid image.

import { evaluateImageUrl } from '@swift2/shared';

/** Evidence a theory write can cite: the cluster's resolved image and the
 * knowledge_doc ids (`current:<current_item id>`) of the current_item rows it
 * rode in on. */
export interface TheoryEvidence {
  imageUrl?: string | null;
  evidenceIds?: readonly string[];
}

export interface TheoryImageFields {
  image_url: string | null;
  quality_hold_reason: string | null;
}

/** Column values for a theory given its candidate evidence image. */
export function theoryImageFields(imageUrl: string | null | undefined): {
  published: boolean;
  fields: TheoryImageFields;
} {
  const verdict = evaluateImageUrl(imageUrl);
  if (verdict.ok) return { published: true, fields: { image_url: imageUrl as string, quality_hold_reason: null } };
  return { published: false, fields: { image_url: null, quality_hold_reason: verdict.reason } };
}

/** Existing ids first, then any new ones, deduped. */
export function mergeEvidenceIds(existing: unknown, added: readonly string[]): string[] {
  const current = Array.isArray(existing) ? existing.filter((v): v is string => typeof v === 'string') : [];
  return [...new Set([...current, ...added])];
}
