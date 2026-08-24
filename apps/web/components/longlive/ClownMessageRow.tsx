'use client';

/**
 * One turn of the clown-bot transcript — split out of ClownChat.tsx to keep
 * that file under the 300-line cap (see MAP.md). Renders the user's
 * right-aligned bubble and the bot's full-width, no-bubble reply for a
 * single `ClownMessage`.
 *
 * Segment labels ("For" / "But then again") are deliberately gone per the
 * founder's mockup (2026-08-14) — only the counterpoint's left accent rule
 * marks the pivot now. `delulu === null` still renders no chip at all (0 is
 * a real score and must render; see clown-answer.ts).
 */

import { ChevronDown, Copy, RotateCcw, Search, ThumbsUp, VenetianMask } from 'lucide-react';
import { useState } from 'react';
import type { ClownSegment, InvestigationStep } from '@/lib/longlive/clown-answer';
import { investigationLabel } from '@/lib/longlive/clown-chat-helpers';
import type { RetrievedItem } from '@/lib/longlive/clown-fallback';
import type { ClownMessage } from '@/lib/longlive/store';

const MAX_DELULU = 5;

function DeluluBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--clown-line)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--clown-ink-soft)]">
      <VenetianMask className="h-3 w-3 text-[color:var(--era-accent)]" aria-hidden />
      Delulu <span className="font-semibold tabular-nums text-[color:var(--clown-ink)]">{value}</span>/{MAX_DELULU}
    </span>
  );
}

function SegmentBlock({ segment }: { segment: ClownSegment }) {
  switch (segment.role) {
    case 'stance':
      return <p className="text-base leading-relaxed text-[color:var(--clown-ink)]">{segment.text}</p>;
    case 'counterpoint':
      return (
        <p className="border-l-2 border-[color:var(--era-accent)] pl-3 leading-relaxed text-[color:var(--clown-ink)]">
          {segment.text}
        </p>
      );
    case 'aside':
      return <p className="italic leading-relaxed text-[color:var(--clown-ink-soft)]">{segment.text}</p>;
    case 'argument':
    case 'plain':
    default:
      return <p className="whitespace-pre-line leading-relaxed text-[color:var(--clown-ink)]">{segment.text}</p>;
  }
}

/** A citation, compacted to a bordered inline pill — a receipt, not a
 * paragraph. `status` drives only the dot: accent means `confirmed`, muted
 * means anything else. */
function SourceChip({ item }: { item: RetrievedItem }) {
  const isConfirmed = item.status === 'confirmed';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--clown-line)] px-2 py-1 text-xs text-[color:var(--clown-ink-soft)]">
      <span
        aria-hidden
        className={
          isConfirmed
            ? 'h-[5px] w-[5px] flex-none rounded-full bg-[color:var(--era-accent)]'
            : 'h-[5px] w-[5px] flex-none rounded-full bg-[color:var(--clown-ink-soft)] opacity-60'
        }
      />
      <span className="font-medium text-[color:var(--clown-ink)]">{item.headline}</span>
      <span>&middot; {item.date}</span>
    </span>
  );
}

/**
 * PLAN.md Stage 10 — the agent loop's tool-call trail, rendered
 * transparently: what the bot looked up and found, collapsed by default so
 * it doesn't compete with the answer itself. `[]` for every non-loop
 * producer (crisis/blocklist/scope-redirect/chip/degraded) — this renders
 * nothing for those, matching how sources already render nothing when empty.
 */
function InvestigationTrail({ steps }: { steps: InvestigationStep[] }) {
  const [open, setOpen] = useState(false);
  if (steps.length === 0) return null;
  return (
    <div className="mt-3 text-xs text-[color:var(--clown-ink-soft)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 font-medium"
      >
        <Search className="h-3 w-3" aria-hidden />
        what I looked up ({steps.length})
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 pl-4">
          {steps.map((step, i) => (
            <li key={i} className="list-disc">
              {investigationLabel(step)} — {step.summary}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A copy / ask-again / good-answer icon button under a reply. None of the
 * three are wired to anything — there is no clipboard write, no re-ask, no
 * feedback endpoint specified in the brief — so all three are explicitly
 * `disabled` rather than shipped as live-looking dead controls.
 *
 * Visual size stays at the mockup's ~28px (`h-7 w-7`) — a chunky icon
 * button is exactly what makes an embedded chat panel read as a web form
 * instead of an app. The 44px accessible hit area comes from an invisible
 * `::before` that extends 8px past the box on every side (28 + 8*2 = 44)
 * without adding any visible bulk, so the row's layout won't shift if these
 * are ever enabled.
 */
function ActionButton({ label, icon: Icon }: { label: string; icon: typeof Copy }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="relative inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[color:var(--clown-ink-soft)] transition before:absolute before:-inset-2 before:content-[''] hover:bg-[color:var(--clown-raised)] hover:text-[color:var(--clown-ink)] disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-[color:var(--clown-ink-soft)]"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

export function ClownMessageRow({ message }: { message: ClownMessage }) {
  return (
    <>
      {/* user turn: right-aligned bubble — the single strongest "chat" cue */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[1.125rem_1.125rem_0.25rem_1.125rem] bg-[color:var(--clown-raised)] px-3.5 py-2.5 text-[15px] leading-relaxed text-[color:var(--clown-ink)]">
          {message.question}
        </div>
      </div>

      {/* bot turn: avatar + full-width reply, no bubble */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--clown-bg)]"
        >
          <VenetianMask className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-[15px]">
          {(message.answer.theoryName || message.answer.delulu !== null) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {message.answer.theoryName && (
                <span className="rounded-full bg-[color:var(--era-accent)]/15 px-2.5 py-0.5 text-xs font-semibold text-[color:var(--era-accent)]">
                  {message.answer.theoryName}
                </span>
              )}
              {/* Explicit null check, not a falsy check — 0 is a real score
                  and must still render; only `null` (the fallback path)
                  omits this. */}
              {message.answer.delulu !== null && <DeluluBadge value={message.answer.delulu} />}
            </div>
          )}
          <div className="space-y-3">
            {message.answer.segments.map((seg, i) => (
              <SegmentBlock key={i} segment={seg} />
            ))}
          </div>
          {message.answer.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {message.answer.sources.map((it) => (
                <SourceChip key={it.id} item={it} />
              ))}
            </div>
          )}
          <InvestigationTrail steps={message.answer.investigation} />
          {/* gap-4 (16px) so the buttons' invisible 44px hit areas (each
              extending 8px past the 28px box) meet edge-to-edge instead of
              overlapping — visual spacing stays tight, tap zones don't. */}
          <div className="mt-1 flex gap-4">
            <ActionButton label="Copy answer" icon={Copy} />
            <ActionButton label="Ask again" icon={RotateCcw} />
            <ActionButton label="Good answer" icon={ThumbsUp} />
          </div>
        </div>
      </div>
    </>
  );
}
