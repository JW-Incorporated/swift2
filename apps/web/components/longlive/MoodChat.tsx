'use client';

/**
 * Mood Chat — Stage 5, the reader-facing surface. Stages 1–4 (catalogue,
 * scoring, matcher, `/api/mood`) already shipped; this is the page that was
 * missing, which is why the feature was invisible on the site.
 *
 * Contract: `docs/proposals/2026-07-19-mood-chat.md` (build spec) and
 * `docs/content-ops/mood-chat-safety-language.md` (user-facing wording). ALL
 * copy here is the approved wording verbatim — the crisis, heavy and refusal
 * strings come from `mood-safety.ts` so this component cannot drift from what
 * was signed off. Do not reword them here.
 *
 * Two things this component must never do:
 *
 * 1. NEVER persist or transmit the reader's words anywhere but the one POST to
 *    /api/mood. No analytics, no localStorage, no console. The only promise the
 *    disclaimer makes is "what you type isn't saved", and this is where that
 *    promise is either kept or broken.
 * 2. NEVER render songs alongside a crisis response. A song is the wrong answer
 *    to "I want to die" — the API returns `kind: 'crisis'` with no picks, and
 *    this renders the message ALONE.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Sparkles, CornerDownLeft, Loader2 } from 'lucide-react';
import type { MoodMatch } from '@/lib/longlive/mood-match';
import { MOOD_STARTERS, visibleStarters, type MoodStarter } from '@/lib/longlive/mood-starters';
import { getEra } from '@swift2/experience';
import { MoodSongCard } from './MoodSongCard';

/** The approved disclaimer (Block 3). Deliberately mentions neither therapy nor
 *  crisis: naming those before the reader has typed anything primes distress
 *  that isn't there. The protective framing lives in the crisis response, which
 *  fires only when someone actually takes it that way. */
const DISCLAIMER = "Tell me how you're feeling and I'll find the songs that fit. What you type isn't saved.";

const MAX_CHARS = 300;

type Result =
  | { kind: 'crisis'; message: string[] }
  | { kind: 'refusal'; message: string }
  | { kind: 'unclear'; message: string }
  | { kind: 'matches'; picks: MoodMatch[]; intro?: string }
  | null;

export function MoodChat() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const starters = useMemo(() => visibleStarters(rotation), [rotation]);
  /** Once there's an answer, the starters stop being the way in. */
  const answered = result !== null;

  const ask = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setResult(data);
      // Move the rotation on so the chip set never reads as a fixed menu.
      setRotation((r) => r + 3);
      // The answer now renders directly under the box, so the box itself is
      // usually already in view — scroll only when it isn't, and never yank the
      // input off-screen (`block: 'nearest'`, not 'start'). Screen readers get
      // the answer from the live region regardless of scroll position.
      //
      // #1991: this used to target `resultsRef` (the whole answer block), but
      // a `matches` result with several stacked song cards makes that block
      // taller than the viewport — 'nearest' then aligns its top edge to the
      // viewport top, scrolling the input (which sits above it) off-screen.
      // Targeting the form instead keeps a fixed-height anchor: 'nearest' is
      // still a no-op when the box is already visible, and when it isn't, the
      // scroll brings the box (and the answer starting right below it) into
      // view regardless of how tall the answer itself is.
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      );
    } catch {
      setError("That didn't go through. Try again in a moment?");
    } finally {
      setBusy(false);
    }
  }, []);

  const submitText = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = text.trim();
      if (!t || busy) return;
      void ask({ text: t });
    },
    [text, busy, ask],
  );

  /** Chips send their hand-tuned vector, never their label as text — no model
   *  call, deterministic result, zero cost (safety doc, Stage 3 note). */
  const tapStarter = useCallback(
    (s: MoodStarter) => {
      if (busy) return;
      setText('');
      void ask({ moods: s.moods, energy: s.energy, valence: s.valence });
    },
    [busy, ask],
  );

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-10">
      <header className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--era-line)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          <Sparkles className="h-3.5 w-3.5" />
          Mood
        </div>
        <h1 className="mt-5 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          What are you in the mood for?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
          {DISCLAIMER}
        </p>
      </header>

      <form ref={formRef} onSubmit={submitText} className="mt-8 scroll-mt-24">
        {/* Honeypot — bots fill hidden fields; the API treats a filled `hp` as a
            no-op. Not a label a human ever sees, hence aria-hidden. */}
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <label htmlFor="mood-input" className="sr-only">
          How are you feeling?
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-2 focus-within:border-[color:var(--era-accent)]">
          <textarea
            id="mood-input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submitText(e);
            }}
            rows={2}
            placeholder="however you want to say it"
            className="min-h-[3rem] w-full resize-none bg-transparent px-3 py-2 text-base leading-relaxed text-[color:var(--era-ink)] outline-none placeholder:text-[color:var(--era-ink-soft)]"
          />
          <button
            type="submit"
            disabled={!text.trim() || busy}
            aria-label="Find songs"
            className="mb-1 mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--era-accent)] text-[color:var(--era-bg)] transition disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CornerDownLeft className="h-5 w-5" />}
          </button>
        </div>
      </form>

      {/* THE ANSWER GOES HERE — directly under the box the reader just typed
          into, above the starter chips. It used to render below them, so the
          reply to your own words was pushed off-screen behind "Not sure where
          to start?" — the first thing the founder called out.

          aria-live="polite" + aria-busy: the reply arrives asynchronously with
          no focus change, so a screen reader would otherwise never hear it.
          Polite (not assertive) because nothing here is an interruption — the
          crisis block included; it is an answer, not an alarm. */}
      <div
        ref={resultsRef}
        className="scroll-mt-24"
        aria-live="polite"
        aria-atomic="false"
        aria-busy={busy}
      >
        {error && (
          <p className="mt-8 text-sm text-[color:var(--era-ink-soft)]">{error}</p>
        )}

        {/* Crisis: the message and NOTHING else. No songs, no chips, no retry
            prompt — a playlist is the wrong answer and a "try again" nudge
            would push the reader back toward the box. */}
        {result?.kind === 'crisis' && (
          <div className="mt-8 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-6">
            {result.message.map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'font-[family-name:var(--era-font)] text-xl font-semibold text-[color:var(--era-ink)]'
                    : 'mt-3 leading-relaxed text-[color:var(--era-ink)]'
                }
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Block 6 — a genuine boundary ("I don't do legal advice"). */}
        {result?.kind === 'refusal' && (
          <p className="mt-8 leading-relaxed text-[color:var(--era-ink)]">{result.message}</p>
        )}

        {/* NOT a refusal — "I couldn't find a feeling in that, say more". The
            reader's own words are still in the box above, so this reads as an
            invitation to add to them rather than a rejection. */}
        {result?.kind === 'unclear' && (
          <p className="mt-8 leading-relaxed text-[color:var(--era-ink)]">{result.message}</p>
        )}

        {result?.kind === 'matches' && result.picks.length > 0 && (
          <section className="mt-8" aria-label="Songs that match">
            {/* Block 2 — one added line for heavy-but-not-crisis moods, and
                deliberately no resources dump: that would pathologize ordinary
                sadness. */}
            {result.intro && (
              <p className="mb-5 leading-relaxed text-[color:var(--era-ink)]">{result.intro}</p>
            )}
            <ul className="space-y-4">
              {result.picks.map((p) => (
                <li key={p.slug}>
                  <MoodSongCard pick={p} eraName={getEra(p.eraId).shortName} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Starters live BELOW the answer. Before anyone has asked anything they
          are the way in, so they sit right under the box and lead with the
          prompt. Once there is an answer on screen they are no longer the way
          in — they demote to a quieter "or try one of these" and never again
          sit between the reader's question and its reply.

          Deliberately still rendered after a crisis response rather than
          hidden: the approved copy promises "the songs will still be here
          whenever you want them", and removing every way back would make that
          line false. They are below the message and visually quiet, so they
          don't read as a nudge back toward the box. */}
      <div className={answered ? 'mt-10' : 'mt-5'}>
        <p className="text-sm text-[color:var(--era-ink-soft)]">
          {answered ? 'Or try one of these:' : 'Not sure where to start?'}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {starters.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => tapStarter(s)}
              disabled={busy}
              className="rounded-full border border-[color:var(--era-line)] px-3.5 py-2 text-sm text-[color:var(--era-ink)] transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent)] disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { MOOD_STARTERS };
