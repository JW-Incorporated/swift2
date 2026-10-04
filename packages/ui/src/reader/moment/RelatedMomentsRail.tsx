import { ArrowRight } from 'lucide-react';
import { useHost, useResolveUrl } from '../../host/context';
import { autoFocalPoint, focalPointOf, getEra, primaryImageRef } from '@swift2/experience';
import type { RelatedMoment } from './lib/related';
import { isRemoteUrl } from './momentShared';

/**
 * "Keep reading" — the moment-to-moment cross-links a writer authored on this
 * item via `relatedIds`.
 *
 * These existed in the seeds long before anything rendered them: MomentDetail
 * resolved `relatedIds` only through resolveMotifTrail, which handles the
 * `motif:`/`egg:` namespaces and returns null for `moment:` ids. All 82
 * authored moment links were therefore invisible.
 *
 * Renders nothing when nothing resolves, so an item whose links all dangle
 * degrades to the previous behaviour rather than showing an empty shell.
 */
export function RelatedMomentsRail({
  related,
  onOpen,
}: {
  related: RelatedMoment[];
  onOpen: (id: string) => void;
}) {
  const { Image } = useHost();
  const resolveUrl = useResolveUrl();
  if (related.length === 0) return null;

  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <ArrowRight className="h-4 w-4" />
        Keep reading
      </div>
      <ul className="mt-4 space-y-2">
        {related.map(({ item: target, eraId }) => {
          const targetEra = getEra(eraId);
          const thumb = primaryImageRef(target);
          return (
            <li key={target.id}>
              <button
                onClick={() => {
                  onOpen(target.id);
                  // Match the era → thread pivot: re-anchor a frame later, so
                  // the jump lands after this overlay's scroll lock lifts.
                  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-[color:var(--era-surface)]"
                style={{ borderColor: 'var(--era-line)' }}
              >
                {thumb && (
                  <Image
                    src={resolveUrl(thumb.url)}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized={isRemoteUrl(resolveUrl(thumb.url))}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    style={{ objectPosition: focalPointOf(thumb) }}
                    onLoad={autoFocalPoint(thumb)}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-[color:var(--era-ink)]">
                    {target.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[color:var(--era-ink-soft)]">
                    {targetEra?.shortName ?? eraId}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)]" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
