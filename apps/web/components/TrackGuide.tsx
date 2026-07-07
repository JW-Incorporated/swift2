'use client';

import type { TrackGuideState } from '../lib/useTrackGuide';

const muted = { color: 'var(--ink-soft)', fontSize: 14 } as const;

/**
 * Bottom-sheet listing an album's song notes (the on-demand track guide). Song
 * catalog lives here, off the timeline — so a full tracklist never touches the
 * Tier 0 payload.
 */
export function TrackGuide({
  state,
  onClose,
  onRetry,
}: {
  state: TrackGuideState;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (state.status === 'idle') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${state.album} track guide`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          color: 'var(--ink, #111)',
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflowY: 'auto',
          borderRadius: '16px 16px 0 0',
          padding: '1.25rem 1.25rem 2rem',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {state.album} <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>· track guide</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
          >
            ✕
          </button>
        </div>

        {state.status === 'loading' ? <p style={muted}>Loading…</p> : null}

        {state.status === 'error' ? (
          <div style={{ marginTop: 8 }}>
            <p style={muted}>Couldn&apos;t load the track guide.</p>
            <button
              type="button"
              onClick={onRetry}
              style={{
                marginTop: 8,
                padding: '0.4rem 0.9rem',
                borderRadius: 999,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: 'var(--bg, #fff)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {state.status === 'loaded' && state.tracks.length === 0 ? (
          <p style={{ ...muted, marginTop: 12 }}>Track notes for this album are coming soon.</p>
        ) : null}

        {state.status === 'loaded' && state.tracks.length > 0 ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
            {state.tracks.map((t) => (
              <li key={t.id} style={{ padding: '0.7rem 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {t.trackNumber != null ? (
                    <span style={{ color: 'var(--ink-soft)', fontSize: 12, minWidth: 18 }}>{t.trackNumber}</span>
                  ) : null}
                  <span style={{ fontWeight: 600 }}>{t.trackTitle}</span>
                </div>
                {t.note ? <p style={{ margin: '2px 0 0', lineHeight: 1.5 }}>{t.note}</p> : null}
                {t.sources.length > 0 ? (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {t.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', marginRight: 10 }}
                      >
                        {s.outlet || s.url}
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
