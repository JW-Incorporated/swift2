import { MomentVideo } from '../era/MomentVideo';
import { footnoteVideoSources } from '../lib/video-affordance';
import type { ContentItem } from '@swift2/experience';

export function MomentSources({ item }: { item: ContentItem }) {
  // The citations that still embed in the footnote — see lib/longlive/video-affordance.ts.
  const sourceVideos = footnoteVideoSources(item);
  if (!item.sources || item.sources.length === 0) return null;
  return (
    <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
      {/* A source that is a YouTube link embeds as a click-to-play facade
          (poster thumbnail only until the reader opts in — no iframe loads
          on mount, so this stays cheap in the feed), reusing MomentVideo.
          The citation line below still lists every source for the record.

          Which sources land here is decided by footnoteVideoSources,
          which drops only a citation duplicating the moment's own video
          (it would otherwise render twice on one page). Promoting a lone
          citation UP to the lead slot was considered and deliberately not
          done — see detailVideoFor. */}
      {sourceVideos.map((s, i) => (
        <MomentVideo
          key={`src-vid-${s.url}-${i}`}
          video={{ youtubeId: s.youtubeId, title: s.name }}
          caption={s.name}
          className="mb-4"
        />
      ))}
      {/* Footnote-scale, academic-text style — citations belong here on
          the expanded page, small, not competing with the article. */}
      <p className="text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
        {item.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
        {item.sources.map((s, i) => (
          <span key={`${s.url}-${i}`}>
            {i > 0 && ', '}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
            >
              {s.name}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
