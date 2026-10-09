import type { ContentItem } from '@swift2/experience';
import { TAG_META } from '../lib/tags';
import { SignificanceBadge } from '../era/SignificanceBadge';
import { Byline } from '../legal/Byline';

export function MomentHeader({
  item,
  eraName,
  titleId,
}: {
  item: ContentItem;
  eraName: string;
  titleId: string;
}) {
  return (
    <>
      <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
        {eraName} · {item.dateLabel}
      </span>
      {item.significance && (
        <div className="mt-2">
          <SignificanceBadge significance={item.significance} size="detail" />
        </div>
      )}
      <h1
        id={titleId}
        className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl"
      >
        {item.title}
      </h1>
      <Byline author={item.author} className="mt-3" />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              // 10% (down from 16%) — see tags.ts (#659).
              backgroundColor: `hsl(${TAG_META[t].hue} / 0.1)`,
              color: `hsl(${TAG_META[t].hue})`,
            }}
          >
            {TAG_META[t].label}
          </span>
        ))}
      </div>
    </>
  );
}
