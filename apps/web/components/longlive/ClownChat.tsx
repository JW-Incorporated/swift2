'use client';

/**
 * Clownbot rebuild (build B) — the reader-facing surface. PLAN.md Step 9.
 *
 * Layout, per the founder's brief (2026-08-13), exactly:
 *   1. Big title, "clown bot", `font-era` (the shipped page-title pattern —
 *      see MoodChat.tsx / the old Clownbot.tsx for the identical class).
 *   2. One chat box at the era column's width, pre-filled on load with a
 *      real worked example (`SEED_EXAMPLE`) so a first-time visitor sees
 *      what the bot does. Composer below it; placeholder "lets clown
 *      around" as a real `placeholder` attribute — never submitted content.
 *   3. Two columns beneath (`ClownBoard`) — tapping an item prefills the
 *      composer, never auto-sends.
 *   4. Delulu indicator only in the answer header (J4 — Evidence/Confidence
 *      meters dropped, they restated the source cards). Source cards
 *      (`ClownItemCard`) render beneath every answer.
 *
 * NEVER render Taylor Swift imagery on this surface (see the old
 * Clownbot.tsx's header comment — the premise "I am a bot" should not
 * decorate itself with her face) and never persist the reader's words
 * anywhere but the one POST below.
 *
 * `ClownAnswer` is the single client-facing contract (`clown-answer.ts`) that
 * both producers (the model path and the zero-model fallback path) converge
 * on. Two of its properties are load-bearing for this renderer:
 *
 *   - `segments` render in array order and every non-empty one renders — the
 *     `counterpoint` segment is where the answer argues against itself, and
 *     flattening it into one paragraph is how it stops being visible.
 *   - `delulu` is `number | null`. Null means the fallback path served this
 *     answer and nothing scored it — `DeluluBadge` is omitted entirely in
 *     that case, never defaulted to 0 or a neutral score.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, VenetianMask } from 'lucide-react';
import { SEED_EXAMPLE } from '@/lib/longlive/clown-seed-example';
import type { ClownAnswer, ClownSegment } from '@/lib/longlive/clown-answer';
import type { BoardItem } from '@/lib/longlive/clown-board';
import type { ClownTurn } from '@/lib/longlive/clown-client';
import { promptForItem } from '@/lib/longlive/clown-starters';
import { useAppActions, useAppState, type ClownMessage } from '@/lib/longlive/store';
import { ClownBoard } from './ClownBoard';
import { ClownItemCard } from './ClownItemCard';

const MAX_CHARS = 300;
const MAX_DELULU = 5;
const INPUT_PLACEHOLDER = 'lets clown around';
const NETWORK_ERROR = "That didn't go through. Try again in a moment?";

/**
 * Always the first bubble, and never part of the store's capped transcript —
 * it's a static shipped example, not something the reader sent or the model
 * answered live (see clown-seed-example.ts).
 */
const SEED_MESSAGE: ClownMessage = {
  id: 'seed',
  question: SEED_EXAMPLE.question,
  answer: SEED_EXAMPLE.answer,
};

/** A prior answer, flattened to plain text for the transcript sent to
 * `/api/clown` — the route passes earlier turns straight through to the
 * model as-is (clown-client.ts's `buildMessages`), so this is the one place
 * a `ClownAnswer`'s segments collapse back into a single utterance. */
function flattenAnswer(answer: ClownAnswer): string {
  return answer.segments.map((s) => s.text).join('\n\n');
}

function DeluluBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--era-line)] px-2.5 py-1 text-xs font-semibold text-[color:var(--era-ink)]">
      <VenetianMask className="h-3.5 w-3.5 text-[color:var(--era-accent)]" aria-hidden />
      Delulu {value}/{MAX_DELULU}
    </span>
  );
}

/**
 * One prose segment. `counterpoint` gets the visual turn — a left rule and a
 * "But then again" label — so the self-argument reads as a deliberate pivot
 * rather than blending into the paragraph before it (clown-answer.ts: this is
 * the segment that keeps the bot honest, and it must stay legible).
 */
function SegmentBlock({ segment }: { segment: ClownSegment }) {
  switch (segment.role) {
    case 'stance':
      return <p className="text-lg leading-relaxed text-[color:var(--era-ink)]">{segment.text}</p>;
    case 'argument':
      return (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">For</p>
          <p className="mt-1 leading-relaxed text-[color:var(--era-ink)]">{segment.text}</p>
        </div>
      );
    case 'counterpoint':
      return (
        <div className="border-l-2 border-[color:var(--era-accent)] pl-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
            But then again
          </p>
          <p className="mt-1 leading-relaxed text-[color:var(--era-ink)]">{segment.text}</p>
        </div>
      );
    case 'aside':
      return <p className="italic leading-relaxed text-[color:var(--era-ink-soft)]">{segment.text}</p>;
    case 'plain':
    default:
      return <p className="whitespace-pre-line leading-relaxed text-[color:var(--era-ink)]">{segment.text}</p>;
  }
}

export function ClownChat() {
  const [text, setText] = useState('');
  // clownMessages is the store's capped (6), memory-only, never-persisted
  // transcript (store.tsx) — this component holds no transcript state of its
  // own. The seed example always renders first and never counts toward it.
  const { clownMessages } = useAppState();
  const { addClownMessage } = useAppActions();
  const messages = useMemo(() => [SEED_MESSAGE, ...clownMessages], [clownMessages]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ask = useCallback(
    async (question: string) => {
      setBusy(true);
      setError(null);
      try {
        // PRIOR turns only, from the store's clownMessages — never SEED_MESSAGE
        // (a shipped fixture, not something this visitor said) and never the
        // question being sent now (the route appends that itself; sending it
        // here too would double it in the model's eyes).
        const transcript: ClownTurn[] = clownMessages.flatMap((m) => [
          { role: 'user' as const, text: m.question },
          { role: 'assistant' as const, text: flattenAnswer(m.answer) },
        ]);
        // `chip` deliberately omitted: that flag routes to the deterministic
        // zero-model fallback (board taps only prefill the composer — once the
        // reader hits send, per the founder's brief it's a normal question and
        // gets the full model treatment). The route's chip path stays built
        // and tested but is not wired up here on purpose.
        const res = await fetch('/api/clown', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: question, transcript }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const answer: ClownAnswer = await res.json();
        addClownMessage(question, answer);
        setText('');
      } catch {
        setError(NETWORK_ERROR);
      } finally {
        setBusy(false);
      }
    },
    [addClownMessage, clownMessages],
  );

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = text.trim();
      if (!t || busy) return;
      void ask(t);
    },
    [text, busy, ask],
  );

  /** A board tap prefills the composer and brings it into view — it never
   * sends (founder brief item 3: "the user stays in control"). */
  const handleBoardSelect = useCallback((item: BoardItem) => {
    setText(promptForItem(item));
    requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current?.focus();
    });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-10">
      <header className="text-center">
        <h1 className="mt-5 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          clown bot
        </h1>
      </header>

      <div className="mt-8 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-5">
        <div className="space-y-8" aria-live="polite" aria-atomic="false" aria-busy={busy}>
          {messages.map((m) => (
            <article key={m.id}>
              <p className="text-sm font-medium text-[color:var(--era-ink-soft)]">{m.question}</p>
              {m.answer.theoryName && (
                <h2 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold text-[color:var(--era-ink)]">
                  {m.answer.theoryName}
                </h2>
              )}
              {/* Explicit null check, not a falsy check — 0 is a real score and
                  must still render; only `null` (the fallback path) omits this. */}
              {m.answer.delulu !== null && (
                <div className="mt-3">
                  <DeluluBadge value={m.answer.delulu} />
                </div>
              )}
              <div className="mt-3 space-y-3">
                {m.answer.segments.map((seg, i) => (
                  <SegmentBlock key={i} segment={seg} />
                ))}
              </div>
              {m.answer.sources.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {m.answer.sources.map((it) => (
                    <ClownItemCard key={it.id} variant="source" item={it} />
                  ))}
                </ul>
              )}
            </article>
          ))}
          {error && (
            <p role="status" className="text-sm text-[color:var(--era-ink-soft)]">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="clown-input" className="sr-only">
            Ask the clown
          </label>
          <div className="flex items-end gap-2 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-bg)] p-2 focus-within:border-[color:var(--era-accent)]">
            <textarea
              id="clown-input"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e);
              }}
              rows={2}
              placeholder={INPUT_PLACEHOLDER}
              className="min-h-[3rem] w-full resize-none bg-transparent px-3 py-2 text-base leading-relaxed text-[color:var(--era-ink)] outline-none placeholder:text-[color:var(--era-ink-soft)]"
            />
            <button
              type="submit"
              disabled={!text.trim() || busy}
              aria-label="Send to clown bot"
              className="mb-1 mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--era-accent)] text-[color:var(--era-bg)] transition disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <CornerDownLeft className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <ClownBoard onSelect={handleBoardSelect} />
      </div>
    </div>
  );
}
