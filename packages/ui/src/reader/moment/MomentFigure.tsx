import { useHost } from '../../host/context';
import { autoFocalPoint, focalPointOf, type ImageKind, type ImageRef } from '@swift2/experience';
import { IMAGE_KIND_BADGE, IMAGE_KIND_NOTE, isRemoteUrl } from './momentShared';

/** The little era-styled pill that marks a non-primary image. */
export function ImageKindBadge({ kind }: { kind: Exclude<ImageKind, 'primary'> }) {
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[color:var(--era-ink-soft)]"
      style={{ borderColor: 'var(--era-line)', backgroundColor: 'var(--era-surface)' }}
    >
      {IMAGE_KIND_BADGE[kind]}
    </span>
  );
}

// One full-width photo woven into the article body, with its honest labeling
// (kind badge / reference note), caption, and credit. Same figure the old
// trailing gallery used, now placed inline between paragraphs (#XYZ v1).
export function MomentFigure({ img, onOpen }: { img: ImageRef; onOpen: () => void }) {
  const { Image } = useHost();
  return (
    <figure className="era-card overflow-hidden rounded-2xl border">
      {/* Tap to open the full-screen zoomable viewer (#525 follow-up); the
          inline crop respects the image's focal point. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="View photo full screen"
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden"
      >
        <Image
          src={img.url}
          alt={img.caption ?? ''}
          fill
          unoptimized={isRemoteUrl(img.url)}
          className="object-cover"
          style={{ objectPosition: focalPointOf(img) }}
          onLoad={autoFocalPoint(img)}
        />
      </button>
      <figcaption className="space-y-1.5 p-3">
        {img.kind !== 'primary' && (
          <div>
            <ImageKindBadge kind={img.kind} />
          </div>
        )}
        {img.kind === 'reference' && (
          <p className="text-xs italic leading-relaxed text-[color:var(--era-ink-soft)]">
            {IMAGE_KIND_NOTE.reference}
          </p>
        )}
        {img.caption && (
          <p className="text-sm leading-relaxed text-[color:var(--era-ink)]">{img.caption}</p>
        )}
        {img.credit && (
          <p className="text-xs text-[color:var(--era-ink-soft)]">Credit: {img.credit}</p>
        )}
      </figcaption>
    </figure>
  );
}
