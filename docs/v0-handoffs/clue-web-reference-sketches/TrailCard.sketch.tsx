// SKETCH ONLY — from v0's very first reply (message 2 of 26), before any repo
// mount was attempted. This is illustrative of the "dossier card" concept
// (span + "still unconfirmed" instead of a completion %), NOT the final
// component. v0 later built a real home.tsx/TrailCard with real imagery and
// decode badges that evolved well past this — but that final source was
// never captured in the export (see docs/clue-web-thread-handoff.md,
// "Why there are no extracted .tsx/.ts files" section, for why).
//
// TrailCard.tsx — a "dossier" card. Uses era vars + lucide.
import { ArrowUpRight, Sparkles } from 'lucide-react'

function TrailCard({ trail }: { trail: Trail }) {
  return (
    <button
      onClick={() => openTrail(trail.id)}
      className="era-card group relative flex flex-col gap-3 p-5 text-left w-full"
      style={{ borderColor: 'var(--era-line)' }}
    >
      <div className="flex items-start justify-between">
        {/* signature glyph, sized 24 */}
        <trail.Glyph className="size-6" style={{ color: 'var(--era-accent)' }} aria-hidden />
        <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--era-ink-soft)' }} />
      </div>

      <h3 className="text-lg font-medium text-balance" style={{ color: 'var(--era-ink)' }}>
        {trail.title}
      </h3>

      {/* the hook line: span + intrigue, NOT completion % */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
        {trail.clueCount} clues · {trail.startYear} → {trail.endYear}
      </p>

      {trail.unconfirmed > 0 && (
        <span className="era-chip inline-flex items-center gap-1 self-start text-xs">
          <Sparkles className="size-3" />
          {trail.unconfirmed} still unconfirmed
        </span>
      )}
    </button>
  )
}
