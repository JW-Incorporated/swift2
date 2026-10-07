import { ArrowRight, Route } from 'lucide-react';
import { useAppActions } from '../store';
import { getThread, type LensId } from '@swift2/experience';
import type { MotifTarget } from './lib/related';

/**
 * The moment → any thread it belongs to, generalized from the Clue-Web-only
 * motif trail above to `ContentItem.threadIds` generally (issue #436). Reuses
 * the same `openThread` pivot every era -> thread jump already uses.
 */
export function FollowThreadsRow({ threadIds }: { threadIds: LensId[] | undefined }) {
  const { openThread } = useAppActions();
  const ids = (threadIds ?? []).filter((id) => id !== 'easter-eggs');
  if (ids.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <Route className="h-4 w-4" />
        Part of a bigger story
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
        This moment is part of {ids.length > 1 ? 'these threads' : 'a thread'} that cuts across
        eras.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {ids.map((id) => {
          const meta = getThread(id);
          return (
            <button
              key={id}
              onClick={() => {
                openThread(id);
                // Same instant re-anchor every era → thread pivot uses (EraSection) —
                // deferred a frame so it lands after this overlay's scroll lock lifts.
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
              }}
              className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
              aria-label={`Follow the ${meta.title} thread`}
            >
              Follow {meta.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The moment → Clue Web jump. With a resolved trail (from relatedIds) it opens
 * the Clue Web directly on that motif's trail; without one it falls back to a
 * plain "Explore the Clue Web" invitation (Clue Web home) — never a dead link.
 */
export function ClueWebCta({ trail }: { trail: MotifTarget | null }) {
  const { openClueWebTrail, openThread } = useAppActions();
  return (
    <button
      onClick={() => {
        if (trail) openClueWebTrail(trail.motifId);
        else openThread('easter-eggs');
        // Same instant re-anchor every era → thread pivot uses (EraSection) —
        // deferred a frame so it lands after this overlay's scroll lock lifts.
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      }}
      className="era-btn-ghost mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
      aria-label={
        trail ? `Follow the ${trail.motif.label} trail in the Clue Web` : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
