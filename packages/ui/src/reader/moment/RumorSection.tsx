import { MessageCircleQuestion } from 'lucide-react';
import { formatFullDate, type RumorNote, type RumorStatus } from '@swift2/experience';

// Per-rumor status badges for the "What's rumored" section. 'unconfirmed' is
// the loud default; a resolved rumor keeps its entry with an honest badge.
const RUMOR_STATUS_BADGE: Record<RumorStatus, string> = {
  unconfirmed: 'Rumor — unconfirmed',
  partially_confirmed: 'Partially confirmed',
  confirmed: 'Since confirmed',
  debunked: 'Debunked',
  // A claim that was reported, never confirmed, never denied, and went quiet.
  // Saying that plainly is the honest end-state; leaving it "unconfirmed"
  // forever implies it is still live (docs/content-ops/rumor-pipeline.md).
  faded: 'Never confirmed or denied',
};

/**
 * The "What's rumored" section — attributed, dated, reported-but-unconfirmed
 * claims, structurally and visually separate from the confirmed narrative
 * above it (dashed borders + its own labeled header + a standing disclaimer;
 * the pill language mirrors the dossier meaning tiers, where dashed = not
 * confirmed). Rumors must never blend into confirmed facts.
 */
export function RumorSection({ rumors }: { rumors: RumorNote[] }) {
  return (
    <section
      aria-label="What's rumored — unconfirmed reports"
      className="mt-10 rounded-2xl border-2 border-dashed p-5"
      style={{ borderColor: 'var(--era-accent)' }}
    >
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[color:var(--era-accent)]">
        <MessageCircleQuestion className="h-4 w-4 shrink-0" />
        What&apos;s rumored
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        Reported claims that have <strong>not</strong> been confirmed by Taylor, her team, or an
        official source — each one attributed to who reported it, and dated. Treat everything below
        as a rumor unless its badge says otherwise.
      </p>
      <ol className="mt-4 space-y-3">
        {rumors.map((r, i) => (
          <li
            // Two rumors can legitimately share a url (one roundup piece
            // reporting several claims), so the key needs the index.
            key={`${r.url}-${i}`}
            className="rounded-xl border border-dashed p-4"
            style={{
              borderColor: 'var(--era-line)',
              backgroundColor: 'var(--era-surface)',
              // A debunked rumor stays on record but visibly recedes.
              opacity: r.status === 'debunked' ? 0.75 : undefined,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={
                  r.status === 'unconfirmed'
                    ? {
                        border: '1px dashed var(--era-accent)',
                        color: 'var(--era-accent)',
                      }
                    : {
                        border: '1px solid var(--era-line)',
                        color: 'var(--era-ink-soft)',
                      }
                }
              >
                {RUMOR_STATUS_BADGE[r.status]}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[color:var(--era-ink-soft)] underline underline-offset-2 hover:text-[color:var(--era-ink)]"
              >
                Reported by {r.reportedBy} · {formatFullDate(r.reportedOn)}
              </a>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
              {r.claim}
            </p>
            {r.note && (
              <p className="mt-1.5 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
                {r.note}
              </p>
            )}
            {/* The citation that settled it. A claim marked "Since confirmed"
                or "Debunked" with nothing to click is just our word for it —
                the whole point of the resolution field is that the reader can
                check. */}
            {r.resolution && (
              <p className="mt-1.5 text-xs text-[color:var(--era-ink-soft)]">
                {r.status === 'debunked' ? 'Debunked by' : 'Confirmed by'}{' '}
                <a
                  href={r.resolution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                >
                  {r.resolution.outlet}
                </a>
                {' · '}
                {formatFullDate(r.resolution.on)}
                {r.resolution.note ? ` — ${r.resolution.note}` : ''}
              </p>
            )}
            {/* Audit transparency: "still unconfirmed" and "nobody has looked
                since June" render identically without this, and they are very
                different claims about how much to trust the label. */}
            {!r.resolution && r.lastCheckedOn && (
              <p className="mt-1.5 text-xs text-[color:var(--era-ink-soft)]">
                Last checked {formatFullDate(r.lastCheckedOn)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
