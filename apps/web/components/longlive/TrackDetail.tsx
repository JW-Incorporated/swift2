'use client';

import { useEffect, useState } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import Image from 'next/image';
import {
  ListMusic,
  Star,
  BookOpen,
  Compass,
  Mic2,
  MessageCircle,
  Link2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@swift2/experience';
import {
  tracksForEra,
  keepExploring,
  releasedFactValue,
  trackKey,
  adjacentTrackOnAlbum,
} from '@/lib/longlive/tracks';
import { videosForEra } from '@/lib/longlive/videos';
import { resolvedTrackVideo } from '@/lib/longlive/track-video';
import { MomentVideo } from './MomentVideo';
import { OverlayNav } from './OverlayNav';
import { TrackFiveCallout } from './TrackFivePill';
import { eraStyle } from '@/lib/longlive/theme';
import { formatFullDate } from '@/lib/longlive/format';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { useSwipeNav } from '@/lib/longlive/useSwipeNav';
import type { EggSource, EraId, TrackFacts, TrackMeaning, TrackNote } from '@swift2/experience';

/** Shown once, ever, the first time a song page has a swipe neighbor
 * (#774 Option 2's "subtle one-time hint"). localStorage, not session —
 * a returning user shouldn't see it again either. */
const SWIPE_HINT_KEY = 'll-track-swipe-hint-seen-v1';

function readSwipeHintSeen(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SWIPE_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

function writeSwipeHintSeen(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SWIPE_HINT_KEY, '1');
  } catch {
    /* private mode / quota — the hint just reappears next visit */
  }
}

// The composite song key now lives in lib/longlive/tracks (so the store's
// deep-link resolver and the ShareSheet can share it). Re-exported here so
// TrackGuide's `import { trackKey } from './TrackDetail'` keeps working.
export { trackKey };

/**
 * A single song's dossier page (issue #440 Phase 1): hero, essential facts,
 * why-it-matters, the researched story, the tiered meaning split
 * (confirmed / supported / fan theory — the site's existing pill language,
 * never blended), live-performance highlights, Taylor's/collaborators'
 * words, and explained catalog connections. Stacks on top of TrackGuide,
 * same immersive-overlay pattern as MomentDetail. Every section renders
 * only when real sourced content exists — never a placeholder.
 */
export function TrackDetail() {
  const { openTrackKey, trackGuideEraId, share } = useAppState();
  const { closeTrack, openTrack } = useAppActions();

  const era = trackGuideEraId ? getEra(trackGuideEraId) : undefined;
  const track =
    era && openTrackKey
      ? tracksForEra(era.id).find((t) => trackKey(era.id, t) === openTrackKey)
      : undefined;

  // Previous/Next (#774 Option 2): every sourced track in album order, not
  // just tracks with a full dossier — see adjacentTrackOnAlbum's doc comment.
  const prevTrack = era && track ? adjacentTrackOnAlbum(era.id, track, 'previous') : null;
  const nextTrack = era && track ? adjacentTrackOnAlbum(era.id, track, 'next') : null;
  const goToTrack = (t: TrackNote) => {
    if (!era) return;
    openTrack(trackKey(era.id, t));
  };

  const [showSwipeHint, setShowSwipeHint] = useState(false);
  useEffect(() => {
    if (!track) return;
    if ((prevTrack || nextTrack) && !readSwipeHintSeen()) {
      setShowSwipeHint(true);
      writeSwipeHintSeen();
      const t = setTimeout(() => setShowSwipeHint(false), 3000);
      return () => clearTimeout(t);
    }
  }, [openTrackKey, track, prevTrack, nextTrack]);

  useSwipeNav(
    Boolean(track) && !share,
    () => nextTrack && goToTrack(nextTrack),
    () => prevTrack && goToTrack(prevTrack),
  );

  useEffect(() => {
    if (!track) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) {
        closeTrack();
        return;
      }
      if (share) return;
      // Left/Right hop songs (#774 Option 2's additive desktop shortcut) —
      // only when focus isn't in an interactive control, so it never steals
      // arrow keys from a text field, a video's own controls, etc.
      const target = e.target as HTMLElement | null;
      const inControl = target?.closest('a, button, input, textarea, select, iframe, [contenteditable]');
      if (inControl) return;
      if (e.key === 'ArrowRight' && nextTrack) goToTrack(nextTrack);
      else if (e.key === 'ArrowLeft' && prevTrack) goToTrack(prevTrack);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [track, closeTrack, share, nextTrack, prevTrack]);

  useBackDismiss(Boolean(track), closeTrack);

  if (!era || !track) return null;

  const dossier = track.dossier;
  // The song's playable video (issue #771): the official video matched from
  // the era's videos rail by title (#439/#440), else the track's own
  // verified audio/lyric `youtubeId` — see `resolvedTrackVideo`'s doc comment
  // in track-video.ts for the fallback rationale and the matcher's
  // recording-separation rule.
  const video = resolvedTrackVideo(track, videosForEra(era.id)) ?? undefined;
  // The dossier backs whyItMatters/meaning/live/voices; the narrative
  // discussion keeps its own citation list. Merged (de-duped by url) into one
  // source line at the foot of the page.
  const sources = mergeSources(dossier?.sources, track.discussionSources ?? track.sources);

  return (
    <div
      // Scroll to the top when hopping song→song (the key remounts the tree).
      key={openTrackKey}
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
      role="dialog"
      aria-modal="true"
      aria-label={`${track.title} — song detail`}
    >
      <OverlayNav
        era={era}
        onClose={closeTrack}
        // track resolved from openTrackKey above, so this rebuilds the same key
        // (typed string, unlike the nullable openTrackKey from the store).
        shareTarget={{ kind: 'track', eraId: era.id, trackKey: trackKey(era.id, track) }}
      />

      {/* Desktop gutter arrows (#774 Option 2): fixed just outside the
          max-w-2xl content column, not the far viewport edges. Hidden below
          lg — mobile gets the compact Previous/Next row near the heading and
          swipe instead. No wrap: absent at either end of the album. */}
      {prevTrack && (
        <div className="hidden lg:block">
          <button
            type="button"
            onClick={() => goToTrack(prevTrack)}
            aria-label={`Previous track: ${prevTrack.title}`}
            title={`Previous: ${prevTrack.title}`}
            className="era-icon-btn fixed top-1/2 z-40 -translate-y-1/2 rounded-full lg:left-[max(1rem,calc(50%-25rem))]"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        </div>
      )}
      {nextTrack && (
        <div className="hidden lg:block">
          <button
            type="button"
            onClick={() => goToTrack(nextTrack)}
            aria-label={`Next track: ${nextTrack.title}`}
            title={`Next: ${nextTrack.title}`}
            className="era-icon-btn fixed top-1/2 z-40 -translate-y-1/2 rounded-full lg:right-[max(1rem,calc(50%-25rem))]"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}

      {/* One-time swipe hint (#774 Option 2), mobile only — desktop already
          has the always-visible gutter arrows. */}
      {showSwipeHint && (
        <div
          className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 lg:hidden"
          aria-live="polite"
        >
          <span className="era-card rounded-full border px-4 py-2 text-xs font-medium shadow-lg">
            Swipe to move between songs
          </span>
        </div>
      )}

      {/* Compact era-art hero (same treatment as TrackGuide/TheoryGuide). */}
      <div className="relative h-[24vh] min-h-36 w-full">
        <Image
          src={era.image || '/placeholder.svg'}
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 30%, transparent), var(--era-bg))',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-5 pb-24">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          <ListMusic className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
          {era.album}
          {track.trackNumber ? ` · Track ${track.trackNumber}` : ''}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {track.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {track.note}
        </p>

        {/* Compact mobile Previous/Next (#774 Option 2) — desktop uses the
            fixed gutter arrows instead, so this row is lg-hidden. Swipe left/
            right does the same thing; these stay as the always-discoverable,
            accessible path. No wrap: an end track only shows its one side. */}
        {(prevTrack || nextTrack) && (
          <div className="mt-4 flex items-center justify-between gap-2 lg:hidden">
            {prevTrack ? (
              <button
                type="button"
                onClick={() => goToTrack(prevTrack)}
                className="era-btn-ghost inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              >
                <ChevronLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{prevTrack.title}</span>
              </button>
            ) : (
              <span />
            )}
            {nextTrack ? (
              <button
                type="button"
                onClick={() => goToTrack(nextTrack)}
                className="era-btn-ghost inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              >
                <span className="truncate">{nextTrack.title}</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}

        {track.trackNumber === 5 && <TrackFiveCallout />}

        {video && <MomentVideo video={video} className="mt-6" />}

        {track.facts && <FactsCard facts={track.facts} />}

        {dossier?.whyItMatters && (
          <Section icon={Star} title="Why this song matters">
            {dossier.whyItMatters.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-[color:var(--era-ink)]">
                {para}
              </p>
            ))}
          </Section>
        )}

        {track.discussion && track.discussion.length > 0 ? (
          <Section icon={BookOpen} title="The story">
            {track.discussion.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-[color:var(--era-ink)]">
                {para}
              </p>
            ))}
            {track.quotedLines && track.quotedLines.length > 0 && (
              <div className="era-card space-y-2 rounded-2xl border p-5">
                {track.quotedLines.map((line, i) => (
                  <p
                    key={i}
                    className="font-[family-name:var(--era-font)] text-lg italic leading-snug text-[color:var(--era-ink)]"
                  >
                    {'“'}
                    {line}
                    {'”'}
                  </p>
                ))}
              </div>
            )}
          </Section>
        ) : (
          !dossier && (
            <p className="mt-6 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
              The full story behind this song hasn&apos;t been written yet — check back soon.
            </p>
          )
        )}

        {dossier?.meaning && <MeaningSection meaning={dossier.meaning} />}

        {dossier?.live && (
          <Section icon={Mic2} title="On stage">
            <ol className="space-y-3">
              {dossier.live.map((m, i) => (
                <li key={i} className="era-card rounded-2xl border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-[family-name:var(--era-font)] text-base font-semibold">
                      {m.event}
                    </span>
                    {m.date && (
                      <span className="text-xs text-[color:var(--era-ink-soft)]">
                        {formatFullDate(m.date)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                    {m.note}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {dossier?.voices && (
          <Section icon={MessageCircle} title="In their words">
            <ul className="space-y-3">
              {dossier.voices.map((v, i) => (
                <li key={i} className="era-card rounded-2xl border p-4">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-[family-name:var(--era-font)] text-base font-semibold">
                      {v.who}
                    </span>
                    {v.context && (
                      <span className="text-xs text-[color:var(--era-ink-soft)]">{v.context}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink)]">
                    {v.note}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <ConnectionsSection eraId={era.id} track={track} />

        {sources.length > 0 && (
          <p className="mt-10 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
            {sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
            {sources.map((s, i) => (
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
        )}
      </div>
    </div>
  );
}

/** De-duped (by url) merge of the dossier and discussion/note citations. */
function mergeSources(...lists: (EggSource[] | undefined)[]): EggSource[] {
  const out: EggSource[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const s of list ?? []) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
    }
  }
  return out;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Star;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
        <Icon className="h-3.5 w-3.5 text-[color:var(--era-accent)]" aria-hidden />
        {title}
      </h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

/** Essential facts (issue #440 §3) — renders only rows that are known. */
function FactsCard({ facts }: { facts: TrackFacts }) {
  const rows: Array<[string, string]> = [];
  const released = releasedFactValue(facts);
  if (released) rows.push(['Released', released]);
  if (facts.writers?.length) rows.push(['Written by', facts.writers.join(', ')]);
  if (facts.producers?.length) rows.push(['Produced by', facts.producers.join(', ')]);
  if (facts.isSingle) {
    rows.push([
      'Single',
      facts.singleReleaseDate ? `Released ${formatFullDate(facts.singleReleaseDate)}` : 'Yes',
    ]);
  }
  if (facts.themes?.length) rows.push(['Themes', facts.themes.join(', ')]);
  if (rows.length === 0) return null;

  return (
    <div className="era-card mt-6 rounded-2xl border p-5">
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 text-sm">
            <dt className="w-24 shrink-0 uppercase tracking-wider text-[11px] leading-5 text-[color:var(--era-ink-soft)]">
              {label}
            </dt>
            <dd className="min-w-0 leading-5 text-[color:var(--era-ink)]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The tiered meaning split (issue #440 §5). Reuses the site's existing pill
 * language: accent fill = confirmed (TheoryGuide's settled treatment), solid
 * border = supported reading, dashed border = fan theory (Clue Web's
 * unconfirmed convention) — one visual system, not a new one.
 */
function MeaningSection({ meaning }: { meaning: TrackMeaning }) {
  return (
    <Section icon={Compass} title="What it means">
      {meaning.confirmed && (
        <MeaningTier
          pill="Confirmed"
          pillStyle={{
            backgroundColor: 'color-mix(in srgb, var(--era-accent) 16%, transparent)',
            color: 'var(--era-accent)',
          }}
          paras={meaning.confirmed}
        />
      )}
      {meaning.supported && (
        <MeaningTier
          pill="Supported reading"
          pillStyle={{ border: '1px solid var(--era-line)', color: 'var(--era-ink-soft)' }}
          paras={meaning.supported}
        />
      )}
      {meaning.fanTheories && (
        <MeaningTier
          pill="Fan theory"
          pillStyle={{ border: '1px dashed var(--era-line)', color: 'var(--era-ink-soft)' }}
          paras={meaning.fanTheories}
        />
      )}
    </Section>
  );
}

function MeaningTier({
  pill,
  pillStyle,
  paras,
}: {
  pill: string;
  pillStyle: React.CSSProperties;
  paras: string[];
}) {
  return (
    <div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
        style={pillStyle}
        title="How much weight this reading carries"
      >
        {pill}
      </span>
      <div className="mt-2 space-y-3">
        {paras.map((para, i) => (
          <p key={i} className="text-base leading-relaxed text-[color:var(--era-ink)]">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Explained catalog connections (issue #440 §10/§22). The first entry is
 * always the album's next song (Joey, 2026-07-15 — lib keepExploring), then
 * the curated connections. Song targets hop to that song's own dossier
 * (openSong retargets the guide underneath); moment targets close this
 * overlay stack first — MomentDetail sits at a lower z-index and would
 * otherwise open invisibly behind this one.
 */
function ConnectionsSection({ eraId, track }: { eraId: EraId; track: TrackNote }) {
  const { openSong, openItem, closeTrackGuide } = useAppActions();
  const resolved = keepExploring(eraId, track);
  if (resolved.length === 0) return null;

  return (
    <Section icon={Link2} title="Keep exploring">
      <ul className="space-y-2">
        {resolved.map((r) => {
          const target =
            r.kind === 'song'
              ? {
                  hint: getEra(r.eraId).shortName,
                  onClick: () => openSong(r.eraId, trackKey(r.eraId, r.track)),
                }
              : {
                  hint: getEra(r.item.eraId).shortName,
                  onClick: () => {
                    closeTrackGuide();
                    openItem(r.item.id);
                  },
                };
          return (
            <li key={r.connection.relatedId}>
              <button
                onClick={target.onClick}
                className="era-card group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-[family-name:var(--era-font)] text-base font-semibold leading-snug">
                    {r.connection.label}
                  </span>
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                    {r.kind === 'song' ? `Song · ${target.hint}` : `Moment · ${target.hint}`}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                    {r.connection.why}
                  </p>
                </div>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)]"
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
