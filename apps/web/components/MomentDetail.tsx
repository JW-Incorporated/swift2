'use client';

import type { MomentLoadState } from '@swift2/shared';

// Copy + retry-ability for each degraded state (the spec's slow/timeout/404/
// offline set; superseded taps never reach the UI — the hook drops them).
const DEGRADED: Partial<Record<MomentLoadState['status'], { message: string; retry: boolean }>> = {
  offline: { message: "You're offline. Reconnect to see this moment.", retry: true },
  timeout: { message: 'This is taking a while — check your connection and try again.', retry: true },
  error: { message: "Couldn't load this moment. Try again.", retry: true },
  notfound: { message: 'No extra detail for this one yet.', retry: false },
};

const muted = { color: 'var(--ink-soft)', fontSize: 14 } as const;

export function MomentDetail({
  state,
  title,
  onClose,
  onRetry,
}: {
  state: MomentLoadState;
  title: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (state.status === 'idle') return null;
  const degraded = DEGRADED[state.status];
  const { moment } = state;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
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
        {state.status === 'slow' ? <p style={muted}>Still loading…</p> : null}

        {state.status === 'loaded' && moment ? (
          <div style={{ marginTop: 8 }}>
            {moment.context ? <p style={{ lineHeight: 1.55, margin: '0 0 12px' }}>{moment.context}</p> : null}
            {moment.photos.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {moment.photos.map((p) => (
                  <figure key={p.url} style={{ margin: 0, maxWidth: '100%' }}>
                    {/* Hotlinked, never rehosted (per data rules). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" loading="lazy" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                    {p.credit ? <figcaption style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{p.credit}</figcaption> : null}
                  </figure>
                ))}
              </div>
            ) : null}
            {moment.sources.length > 0 ? (
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13 }}>
                {moment.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                      {s.outlet || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {degraded ? (
          <div style={{ marginTop: 8 }}>
            <p style={muted}>{degraded.message}</p>
            {degraded.retry ? (
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
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
