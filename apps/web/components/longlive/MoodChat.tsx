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
import { getEra } from '@/lib/longlive/eras';
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
  | { kind: 'matches'; picks: MoodMatch[]; intro?: string }
  | null;

export function MoodChat() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const starters = useMemo(() => visibleStarters(rotation), [rotation]);

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
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

      <form onSubmit={submitText} className="mt-8">
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

      <div className="mt-5">
        <p className="text-sm text-[color:var(--era-ink-soft)]">Not sure where to start?</p>
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

      <div ref={resultsRef} className="scroll-mt-24">
        {error && (
          <p role="status" className="mt-8 text-sm text-[color:var(--era-ink-soft)]">
            {error}
          </p>
        )}

        {/* Crisis: the message and NOTHING else. No songs, no chips, no retry
            prompt — a playlist is the wrong answer and a "try again" nudge
            would push the reader back toward the box. */}
        {result?.kind === 'crisis' && (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-6"
          >
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

        {result?.kind === 'refusal' && (
          <p role="status" className="mt-8 leading-relaxed text-[color:var(--era-ink)]">
            {result.message}
          </p>
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
    </div>
  );
}

export { MOOD_STARTERS };
