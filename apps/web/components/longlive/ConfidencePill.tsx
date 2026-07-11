import type { Confidence } from '@/lib/longlive/types';

/**
 * Human label for each confidence tier. Extracted from TheoryGuide.tsx
 * (issue #440 Track Guide overhaul, Phase 0) so any surface with real
 * confidence-tiered data — theories today, tracks later once Phase 2 authors
 * it — can render the exact same pill instead of re-implementing it.
 */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  official: 'Official',
  confirmed_interview: 'Confirmed in interview',
  reputable_reporting: 'Reported',
  strong_fan_consensus: 'Fan consensus',
  plausible: 'Plausible',
  clowning: 'Clowning',
  disproven: 'Disproven',
  joke_meme: 'Joke / meme',
};

/**
 * The era-styled "how much weight this claim carries" pill — same markup
 * TheoryGuide's theory cards have always rendered, now shared so other
 * surfaces (e.g. a future track credibility tag) can reuse it verbatim
 * instead of drifting from it. Never fabricate a `confidence` value to feed
 * this — only render it where the data legitimately has one.
 */
export function ConfidencePill({ confidence, className }: { confidence: Confidence; className?: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]${className ? ` ${className}` : ''}`}
      style={{ borderColor: 'var(--era-line)' }}
      title="How much weight the claim carries"
    >
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}
