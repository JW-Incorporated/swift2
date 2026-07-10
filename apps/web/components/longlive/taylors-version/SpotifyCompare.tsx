'use client';

import { useState } from 'react';
import { Music } from 'lucide-react';
import type { ReRecord } from '@/lib/longlive/types';

type SpotifyRefs = ReRecord['spotify'];
type Side = 'original' | 'taylorsVersion';

function SpotifyEmbed({ id, title }: { id: string; title: string }) {
  return (
    <iframe
      title={title}
      src={`https://open.spotify.com/embed/album/${id}?utm_source=generator&theme=0`}
      width="100%"
      height={352}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      style={{ border: 0, borderRadius: '0.5rem', colorScheme: 'normal' }}
    />
  );
}

/** A small labelled panel wrapping one embed. */
function SidePanel({
  label,
  sublabel,
  accent,
  children,
}: {
  label: string;
  sublabel: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
          {label}
        </span>
        <span className="truncate text-xs" style={{ color: 'var(--era-ink-soft)' }}>
          {sublabel}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Rendered when a side has no available album to link. */
function MissingPanel({ label, accent, message }: { label: string; accent: string; message: string }) {
  return (
    <SidePanel label={label} sublabel="" accent={accent}>
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-8 text-center"
        style={{ height: 352, border: '1px dashed var(--era-line)', backgroundColor: 'var(--era-surface-2)' }}
      >
        <Music size={20} style={{ color: 'var(--era-ink-soft)', opacity: 0.5 }} />
        <p className="max-w-[16rem] text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
          {message}
        </p>
      </div>
    </SidePanel>
  );
}

/**
 * Side-by-side original vs. Taylor's Version Spotify embeds. Degrades
 * gracefully: shows a real player for whichever side has a verified album ID,
 * and an honest explanatory message (not a broken embed) for the side that
 * doesn't — either because no TV exists yet, or because the original master
 * isn't the release Taylor points fans to.
 */
export function SpotifyCompare({
  spotify,
  albumName,
  isPending,
}: {
  spotify: SpotifyRefs;
  albumName: string;
  /** True when no Taylor's Version has been released yet. */
  isPending: boolean;
}) {
  const { original, taylorsVersion } = spotify;
  const [mobileSide, setMobileSide] = useState<Side>(taylorsVersion ? 'taylorsVersion' : 'original');

  if (!original && !taylorsVersion) return null;

  const bothAvailable = Boolean(original && taylorsVersion);
  const originalMissingMsg = isPending
    ? "No Taylor's Version to compare against yet."
    : `The original ${albumName} master isn't the release Taylor points fans to — she encourages streaming Taylor's Version instead.`;
  const tvMissingMsg = "Taylor's Version hasn't been released yet. When it lands, it will appear here for side-by-side listening.";

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <Music size={12} style={{ color: 'var(--era-accent)' }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--era-accent)' }}>
          {bothAvailable ? 'Listen side by side' : 'Listen'}
        </span>
      </div>

      {/* Mobile: segmented control + single embed (only when both exist) */}
      {bothAvailable && (
        <div className="md:hidden">
          <div
            className="mb-3 flex items-center gap-1 rounded p-0.5"
            style={{ backgroundColor: 'var(--era-surface)', border: '1px solid var(--era-line)' }}
            role="group"
            aria-label="Choose which version to play"
          >
            {(
              [
                { key: 'original' as Side, label: 'Original', accent: 'var(--status-disputed-ink)' },
                { key: 'taylorsVersion' as Side, label: "Taylor's Version", accent: 'var(--status-reclaimed-ink)' },
              ]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMobileSide(opt.key)}
                className="flex-1 rounded px-3 py-1.5 text-xs transition-colors"
                style={{
                  backgroundColor: mobileSide === opt.key ? 'var(--era-surface-2)' : 'transparent',
                  color: mobileSide === opt.key ? opt.accent : 'var(--era-ink-soft)',
                  border: mobileSide === opt.key ? '1px solid var(--era-line)' : '1px solid transparent',
                }}
                aria-pressed={mobileSide === opt.key}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {mobileSide === 'original' && original && (
            <SpotifyEmbed id={original} title={`${albumName} — original master on Spotify`} />
          )}
          {mobileSide === 'taylorsVersion' && taylorsVersion && (
            <SpotifyEmbed id={taylorsVersion} title={`${albumName} (Taylor's Version) on Spotify`} />
          )}
        </div>
      )}

      {/* Desktop: both side by side (or whichever single one exists) */}
      <div className={bothAvailable ? 'hidden gap-4 md:flex' : 'flex flex-col gap-4 sm:flex-row'}>
        {original ? (
          <SidePanel label="Original master" sublabel="Original recording" accent="var(--status-disputed-ink)">
            <SpotifyEmbed id={original} title={`${albumName} — original master on Spotify`} />
          </SidePanel>
        ) : (
          <MissingPanel label="Original master" accent="var(--status-disputed-ink)" message={originalMissingMsg} />
        )}

        {taylorsVersion ? (
          <SidePanel label="Taylor's Version" sublabel="Re-recorded · hers" accent="var(--status-reclaimed-ink)">
            <SpotifyEmbed id={taylorsVersion} title={`${albumName} (Taylor's Version) on Spotify`} />
          </SidePanel>
        ) : (
          <MissingPanel label="Taylor's Version" accent="var(--status-reclaimed-ink)" message={tvMissingMsg} />
        )}
      </div>
    </div>
  );
}
