// SKETCH ONLY — from v0's very first reply (message 2 of 26), before any repo
// mount was attempted. This is illustrative of the "tap-to-decode" mechanic
// (evidence always visible, meaning blurred behind a lock button) and the
// "timed gap" connector concept, NOT the final component. The real, final
// trail-view.tsx (built later, with the Seed/Build/Payoff beat headers, the
// TrailScrubber, the persistent decode-progress wiring, the "THIS CLUE ECHOES
// IN" nudge, fan theories, and "your read?" reactions) was never captured in
// the export — see docs/clue-web-thread-handoff.md for why, and for a full
// prose description of what the final version actually does.
//
// ClueNode.tsx — evidence open, meaning behind a decode tap.
import { Lock, Unlock, CalendarClock } from 'lucide-react'

function ClueNode({ clue, gapLabel }: { clue: Clue; gapLabel?: string }) {
  const [decoded, setDecoded] = useState(false)
  return (
    <li className="relative pl-6" data-ll-date={clue.date} data-ll-era={clue.eraId}>
      {/* spine + time gap connector */}
      {gapLabel && (
        <span className="mb-3 flex items-center gap-1 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
          <CalendarClock className="size-3" /> {gapLabel}
        </span>
      )}

      <article className="era-card p-4">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
          <span className="era-chip">{clue.eraLabel}</span>
          <time>{clue.dateLabel}</time>
        </div>

        {/* evidence — always visible */}
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--era-ink)' }}>
          {clue.evidence}
        </p>

        {/* meaning — tap to decode */}
        <button
          onClick={() => setDecoded((d) => !d)}
          className="era-btn-ghost mt-3 flex w-full items-center gap-2 text-sm"
          aria-expanded={decoded}
        >
          {decoded ? <Unlock className="size-4" /> : <Lock className="size-4" />}
          {decoded ? 'The payoff' : 'Decode this clue'}
        </button>

        <p
          className="mt-2 text-sm leading-relaxed transition-all"
          style={{
            color: 'var(--era-ink)',
            filter: decoded ? 'none' : 'blur(6px)',
            userSelect: decoded ? 'auto' : 'none',
          }}
          aria-hidden={!decoded}
        >
          {clue.meaning}
        </p>
      </article>
    </li>
  )
}
