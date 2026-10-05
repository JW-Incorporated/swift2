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
  type SearchDocType,
  type SearchResult,
  type SearchTarget,
} from '@swift2/experience';
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
  const Icon = TYPE_ICON[doc.type];
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
        <span className="block truncate text-sm font-medium">{doc.title}</span>
        <span className="block truncate text-xs text-[color:var(--era-ink-soft)]">
          {doc.snippet}
        </span>
      </span>
      {doc.eraId && (
        <span className="mt-0.5 hidden shrink-0 rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] text-[color:var(--era-ink-soft)] sm:inline">
          {getEra(doc.eraId).shortName}
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
