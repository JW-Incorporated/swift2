import { useState } from 'react';
import {
  Clapperboard,
  Compass,
  CornerDownLeft,
  Layers,
  Lightbulb,
  Music2,
  Search,
  Sparkles,
  Waypoints,
} from 'lucide-react';
import {
  getEra,
  hasDisplayablePhoto,
  primaryImageRef,
  type SearchDocType,
  type SearchResult,
  type SearchTarget,
} from '@swift2/experience';
import { useHost } from '../../host/context';
import { useReader } from '../../snapshot/context';
import { cn } from '../lib/utils';

const TYPE_ICON: Record<SearchDocType, typeof Search> = {
  era: Compass,
  thread: Layers,
  moment: Sparkles,
  egg: Waypoints,
  theory: Lightbulb,
  track: Music2,
  video: Clapperboard,
};

export function optionId(key: string): string {
  // Doc keys contain spaces/quotes (track titles); ids must be CSS-safe.
  return `ll-search-opt-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function ResultRow({
  result,
  isActive,
  index,
  onHover,
  onSelect,
}: {
  result: SearchResult;
  isActive: boolean;
  index: number;
  onHover: (index: number) => void;
  onSelect: (target: SearchTarget) => void;
}) {
  const { doc } = result;
  const { Image } = useHost();
  const [thumbFailed, setThumbFailed] = useState(false);
  const q = useReader();
  const Icon = TYPE_ICON[doc.type];
  const item = doc.target.kind === 'moment' ? q.getContentItem(doc.target.itemId) : undefined;
  const thumb = item && !thumbFailed && hasDisplayablePhoto(item) ? primaryImageRef(item) : undefined;
  const meta = [doc.eraId ? getEra(doc.eraId).shortName : null, item?.dateLabel]
    .filter(Boolean)
    .join(' · ');
  return (
    <button
      type="button"
      id={optionId(doc.key)}
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(doc.target)}
      onMouseMove={() => onHover(index)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors',
        isActive && 'bg-[color:var(--era-surface-2)]',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--era-accent)]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium">{doc.title}</span>
        {meta && (
          <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-[color:var(--era-ink-soft)]">
            {meta}
          </span>
        )}
        <span className="block truncate text-xs text-[color:var(--era-ink-soft)]">
          {doc.snippet}
        </span>
      </span>
      {thumb && (
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[color:var(--era-surface-2)]">
          <Image
            src={thumb.url}
            alt=""
            fill
            sizes="48px"
            unoptimized={/^https?:\/\//.test(thumb.url)}
            className="object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setThumbFailed(true)}
          />
        </span>
      )}
      {isActive && (
        <CornerDownLeft
          className="mt-1 hidden h-3.5 w-3.5 shrink-0 text-[color:var(--era-ink-soft)] sm:block"
          aria-hidden
        />
      )}
    </button>
  );
}
