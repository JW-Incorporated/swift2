import Link from 'next/link';
import { VARIANTS } from '../../../components/scrubber/types';

export const metadata = {
  title: 'Scrubber variants — pick one',
  description: 'Four live timeline-scrubber designs, side by side, on the real Vault.',
};

const RECOMMENDED = 'A';

/**
 * Tabbed index for the scrubber demo. Each tab links to a full-screen variant
 * rendered against the real Vault data. Built so Joey can flip between all four
 * on one preview URL and pick a favourite.
 */
export default function ScrubberDemoIndex() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0d0d12',
        color: '#f4f4f6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2.5rem 1.25rem 4rem',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: 12, opacity: 0.6, margin: 0 }}>
          Demo · pick one
        </p>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.1, margin: '0.4rem 0 0.75rem' }}>Scrubber variants</h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, opacity: 0.85, margin: '0 0 0.5rem' }}>
          Four different designs for the little timeline control that moves you through the eras —
          each one live on the real Vault. Tap a tab to open it full-screen, play with it, then come
          back and try the next. On a phone the whole point is how it <em>feels</em>.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.7, margin: '0 0 1.75rem' }}>
          What to feel for: does the date <strong>follow your scroll smoothly</strong>? When you
          grab it, does it feel <strong>good and easy to aim</strong>? Can you reach it{' '}
          <strong>no matter where you are</strong> on the page?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {VARIANTS.map((v) => {
            const recommended = v.id === RECOMMENDED;
            return (
              <Link
                key={v.id}
                href={`/demo/scrubber/${v.slug}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#17171f',
                  border: `1px solid ${recommended ? 'rgba(150,190,255,0.55)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 16,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: recommended ? '#8fb4ff' : 'rgba(255,255,255,0.1)',
                      color: recommended ? '#0d0d12' : '#fff',
                      fontWeight: 800,
                      fontSize: 16,
                      flex: '0 0 auto',
                    }}
                  >
                    {v.id}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 17 }}>{v.name}</span>
                      {recommended ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#8fb4ff',
                            border: '1px solid rgba(150,190,255,0.5)',
                            borderRadius: 999,
                            padding: '2px 8px',
                          }}
                        >
                          Recommended default
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{v.tagline}</div>
                  </div>
                  <span aria-hidden style={{ opacity: 0.5, fontSize: 20 }}>
                    ›
                  </span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, margin: '12px 0 0' }}>{v.blurb}</p>
              </Link>
            );
          })}
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.55, marginTop: 28 }}>
          These are prototypes for comparison — enough fidelity to feel the interaction, not final
          polish. All four run on the same real Vault content; only the scrubber differs.{' '}
          <strong style={{ opacity: 0.8 }}>A · Time Reel</strong> is our recommended default, but they
          are all here so you can compare and decide (or ask for a mix).
        </p>
      </div>
    </main>
  );
}
