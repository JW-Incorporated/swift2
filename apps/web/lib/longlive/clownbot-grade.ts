/**
 * Clownbot — the Clown-O-Meter. Two axes, scored separately (research
 * finding #5): evidence quality and delulu ambition. High delulu is a
 * compliment; fabricated receipts are not.
 *
 * THE LOAD-BEARING DESIGN DECISION: **evidence is computed, not claimed.**
 * The model proposes a delulu rating, because ambition is a genuine judgement
 * call. It does NOT get to rate its own evidence — that number is derived here
 * in pure TypeScript from the receipts that actually survived id-validation.
 * A model cannot talk its evidence score up, and a theory resting on a
 * debunked claim is capped no matter how confidently it is argued.
 *
 * Confidence is likewise DERIVED, never asserted (research finding #6 — the one
 * documented way theorists lose community trust is overpromising; fans said
 * "we have been played" after a hyped date produced a merch drop). It is a
 * function of evidence and delulu, and it is hard-capped below certainty:
 * Clownbot is structurally incapable of telling you it is sure.
 */

import type { Receipt } from './clownbot-receipts';

export const MAX_EVIDENCE = 5;
export const MAX_DELULU = 5;

/** Confidence never reaches certainty. This is the point, not a rounding artefact. */
export const CONFIDENCE_CEILING = 85;
export const CONFIDENCE_FLOOR = 3;

export interface ClownGrade {
  /** 0..5, derived from cited receipts. Cannot be inflated by the model. */
  evidence: number;
  /** 0..5, model-proposed, clamped. */
  delulu: number;
  /** 0..100, derived. Never 100. */
  confidence: number;
  /** Playful label keyed to delulu. */
  label: string;
  /** One line explaining how evidence was scored — shown to the reader. */
  rationale: string;
}

const DELULU_LABELS: readonly string[] = [
  'Barely clowning',
  'Mild clowning',
  'Solid clowning',
  'Certified clowning',
  'Full circus',
  'Wig on the ceiling',
];

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  // Guard the coercion holes before Number(): Number(null) is 0 and Number('')
  // is 0, so a missing field would silently read as a real "0 delulu" rather
  // than as absent.
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return rounded < min ? min : rounded > max ? max : rounded;
}

/** Receipt tiers that count as strongly sourced for the evidence bonus. */
function isStrong(receipt: Receipt): boolean {
  return receipt.status === 'confirmed' && receipt.sources.length > 0;
}

/**
 * Score evidence from the receipts actually cited.
 *
 *   +1 per distinct verified receipt, capped at 3
 *   +1 if at least one is confirmed-with-a-source
 *   +1 if there are 2+ receipts and none of them is debunked
 *   hard cap of 1 if ANY cited receipt is debunked — a theory standing on a
 *   dead claim is not well evidenced, however entertaining it is
 *   0 if nothing was cited at all
 */
export function scoreEvidence(receipts: readonly Receipt[]): { score: number; rationale: string } {
  if (receipts.length === 0) {
    return { score: 0, rationale: 'No receipts cited — this is vibes, and I am saying so.' };
  }

  const debunked = receipts.filter((r) => r.status === 'debunked');
  const strong = receipts.filter(isStrong);

  let score = Math.min(receipts.length, 3);
  if (strong.length > 0) score += 1;
  if (receipts.length >= 2 && debunked.length === 0) score += 1;
  score = Math.min(score, MAX_EVIDENCE);

  if (debunked.length > 0) {
    return {
      score: Math.min(score, 1),
      rationale: `Capped: ${debunked.length === 1 ? 'one receipt has' : `${debunked.length} receipts have`} already been debunked, so this is standing on a dead claim.`,
    };
  }

  const parts = [`${receipts.length} receipt${receipts.length === 1 ? '' : 's'} from the vault`];
  if (strong.length > 0) parts.push(`${strong.length} confirmed and sourced`);
  return { score, rationale: `${parts.join(', ')}.` };
}

/**
 * Derive confidence. More evidence pushes it up, more delulu pulls it down,
 * and the ceiling means the honest answer is always "probably" rather than
 * "definitely".
 */
export function deriveConfidence(evidence: number, delulu: number): number {
  const raw = 10 + evidence * 14 - delulu * 6;
  return Math.max(CONFIDENCE_FLOOR, Math.min(CONFIDENCE_CEILING, Math.round(raw)));
}

/**
 * Grade a take. `deluluRaw` is whatever the model claimed; everything else is
 * computed here from verified receipts.
 */
export function gradeTheory(receipts: readonly Receipt[], deluluRaw: unknown): ClownGrade {
  const { score: evidence, rationale } = scoreEvidence(receipts);
  const delulu = clampInt(deluluRaw, 0, MAX_DELULU, 3);
  return {
    evidence,
    delulu,
    confidence: deriveConfidence(evidence, delulu),
    label: DELULU_LABELS[delulu] ?? DELULU_LABELS[DELULU_LABELS.length - 1],
    rationale,
  };
}
