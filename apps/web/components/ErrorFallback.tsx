import type { CSSProperties } from 'react';

/**
 * The page-level "something broke" screen, shared by `app/error.tsx` and
 * `app/global-error.tsx`. Inline styles and system fonts only: it must render
 * when the era theme, the stylesheet or the root layout is the thing that
 * failed.
 */
const shell: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1.25rem',
  background: '#0c0c0c',
  color: '#f4efe6',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  textAlign: 'center',
};

const button: CSSProperties = {
  minHeight: '2.75rem',
  padding: '0 1.5rem',
  borderRadius: '9999px',
  border: '1px solid #f4efe6',
  font: 'inherit',
  fontSize: '0.9375rem',
  fontWeight: 600,
  cursor: 'pointer',
};

export function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <main style={shell}>
      <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b8b0a2' }}>
        Long Live
      </p>
      <div role="alert">
        <h1 style={{ margin: '1rem 0 0', fontSize: '1.75rem', lineHeight: 1.2, fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ margin: '0.75rem auto 0', maxWidth: '26rem', lineHeight: 1.6, color: '#d6cfc2' }}>
          This page hit a problem on our side. Nothing you did caused it.
        </p>
      </div>
      <div style={{ marginTop: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <button type="button" onClick={onRetry} style={{ ...button, background: '#f4efe6', color: '#0c0c0c' }}>
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ ...button, background: 'transparent', color: '#f4efe6' }}
        >
          Reload the page
        </button>
      </div>
    </main>
  );
}
