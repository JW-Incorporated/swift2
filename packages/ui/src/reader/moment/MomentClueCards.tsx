import { Route, Sparkles } from 'lucide-react';
import type { ContentItem } from '@swift2/experience';
import type { MotifTarget } from './lib/related';
import { ClueWebCta } from './MomentThreadLinks';

export function MomentClueCards({
  item,
  trail,
  revealed,
  onReveal,
}: {
  item: ContentItem;
  trail: MotifTarget | null;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <>
      {item.hiddenClue && (
        <div className="era-card mt-8 rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
            <Sparkles className="h-4 w-4" />
            Hidden clue
          </div>
          <p className="mt-2 text-[15px] italic leading-relaxed text-[color:var(--era-ink)]">
            “{item.hiddenClue.clue}”
          </p>
          {revealed ? (
            <div className="clue-reveal">
              <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
                {item.hiddenClue.payoff}
              </p>
              {/* Decoded — now hand the visitor the thread it belongs to. */}
              <ClueWebCta trail={trail} />
            </div>
          ) : (
            <button
              onClick={onReveal}
              className="era-btn-ghost mt-4 rounded-full px-4 py-2 text-sm font-medium"
            >
              Decode it
            </button>
          )}
        </div>
      )}

      {/* A moment can cross-link into a Clue Web trail without carrying its
          own hidden clue — give it the same invitation as its own card. */}
      {!item.hiddenClue && trail && (
        <div className="era-card mt-8 rounded-2xl border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
            <Route className="h-4 w-4" />
            Part of a bigger pattern
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
            This moment belongs to the “{trail.motif.label}” trail — {trail.motif.blurb}
          </p>
          <ClueWebCta trail={trail} />
        </div>
      )}
    </>
  );
}
