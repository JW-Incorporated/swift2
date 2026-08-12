'use client';

/**
 * Clownbot — the reader-facing surface.
 *
 * ALL copy here is imported from clownbot-persona.ts / clownbot-safety.ts and
 * never inlined, so the surface cannot drift from what was reviewed (same
 * discipline as MoodChat). Do not reword strings in this file.
 *
 * Three things this component must never do:
 *
 * 1. NEVER render imagery of Taylor Swift — no photos, no illustrations, and
 *    absolutely nothing AI-generated (research finding #3, #SwiftiesAgainstAI).
 *    Every visual here is a lucide icon or a CSS bar. The vault has real
 *    licensed photography and this surface still does not use it: a page whose
 *    entire premise is "I am a bot" should not decorate itself with her face.
 * 2. NEVER persist or transmit the reader's words anywhere but the one POST to
 *    /api/clownbot. No analytics, no localStorage, no console. The disclaimer
 *    promises "what you type isn't saved" and this is where that is kept.
 * 3. NEVER imply endorsement, affiliation, or insider knowledge. The bot
 *    disclosure sits above the input and the unofficial-project notice sits on
 *    the surface itself, not only in the shared site footer.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, Sparkles, VenetianMask } from 'lucide-react';
import {
  BOT_DISCLOSURE,
  CANON,
  CLOWNBOT_NAME,
  CLOWNBOT_TAGLINE,
  CONFIDENCE_LABEL,
  DELULU_LABEL,
  EMPTY_STATE_BODY,
  EMPTY_STATE_HEADING,
  EVIDENCE_LABEL,
  INPUT_LABEL,
  INPUT_PLACEHOLDER,
  LEDGER_HEADING,
  LEDGER_NOTE,
  MAX_CHARS,
  METER_NOTE,
  NETWORK_ERROR,
  PRIVACY_NOTE,
  RECEIPTS_HEADING,
  UNOFFICIAL_NOTICE,
} from '@/lib/longlive/clownbot-persona';
import { suggestedPrompts, type SuggestedPrompt } from '@/lib/longlive/clownbot-prompts';
import { loreFreshness } from '@/lib/longlive/clownbot-lore';
import { recentLedger, wigCountLine } from '@/lib/longlive/clownbot-ledger';
import { MAX_DELULU, MAX_EVIDENCE } from '@/lib/longlive/clownbot-grade';

interface ReceiptView {
  id: string;
  title: string;
  dateLabel: string;
  detail: string;
  status: string | null;
  sources: { name: string; url: string }[];
}

interface GradeView {
  evidence: number;
  delulu: number;
  confidence: number;
  label: string;
  rationale: string;
}

type Result =
  | { kind: 'refusal'; message: string }
  | { kind: 'empty'; message: string }
  | {
      kind: 'take';
      degraded: boolean;
      theoryName: string | null;
      stance: string;
      argument: string;
      counterpoint: string;
      aside: string;
      grade: GradeView;
      receipts: ReceiptView[];
    }
  | null;

/**
 * A two-axis meter. The bar is decorative and aria-hidden; the value is
 * rendered as text beside it, so the meter is fully readable without relying
 * on ARIA range semantics (WCAG 2.2 AA, and the simplest thing that is
 * correct for every assistive tech).
 */
function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <p className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-[color:var(--era-ink)]">{label}</span>
        <span className="text-[color:var(--era-ink-soft)]">
          {value} of {max}
        </span>
      </p>
      <div
        aria-hidden
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[color:var(--era-line)]"
      >
        <div className="h-full rounded-full bg-[color:var(--era-accent)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Clownbot() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mount-time only, like SiteFooter's vault stamp: a date computed during
  // render would differ between server and client and cause a hydration
  // mismatch. `now` is fixed for the session, which is fine — the whole point
  // of the stamp is that it changes when the FILE changes, not per second.
  const now = useMemo(() => new Date(), []);
  const freshness = useMemo(() => loreFreshness(now), [now]);
  const prompts = useMemo(() => suggestedPrompts(now, rotation), [now, rotation]);
  const ledger = useMemo(() => recentLedger(), []);
  const wigLine = useMemo(() => wigCountLine(), []);

  const ask = useCallback(async (question: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/clownbot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: question }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setResult(await res.json());
      setRotation((r) => r + 3);
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const t = text.trim();
      if (!t || busy) return;
      void ask(t);
    },
    [text, busy, ask],
  );

  const tapPrompt = useCallback(
    (p: SuggestedPrompt) => {
      if (busy) return;
      setText(p.text);
      void ask(p.text);
    },
    [busy, ask],
  );

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-10">
      <header className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--era-line)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          <VenetianMask className="h-3.5 w-3.5" aria-hidden />
          {CLOWNBOT_NAME}
        </div>
        <h1 className="mt-5 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {EMPTY_STATE_HEADING}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
          {CLOWNBOT_TAGLINE} {EMPTY_STATE_BODY}
        </p>
        {/* Bot disclosure, above the fold and above the input — not a footnote. */}
        <p className="mx-auto mt-4 max-w-xl rounded-xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] px-4 py-3 text-sm leading-relaxed text-[color:var(--era-ink)]">
          {BOT_DISCLOSURE} {PRIVACY_NOTE}
        </p>
      </header>

      <form onSubmit={submit} className="mt-8">
        {/* Honeypot — bots fill hidden fields; the API treats a filled `hp` as a no-op. */}
        <input type="text" name="hp" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <label htmlFor="clownbot-input" className="sr-only">
          {INPUT_LABEL}
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-2 focus-within:border-[color:var(--era-accent)]">
          <textarea
            id="clownbot-input"
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
            aria-label="Send to Clownbot"
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

      <div className="mt-5">
        <p className="text-sm text-[color:var(--era-ink-soft)]">Or pick a fight with me about one of these:</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => tapPrompt(p)}
              disabled={busy}
              className="max-w-full rounded-2xl border border-[color:var(--era-line)] px-3.5 py-2 text-left text-sm text-[color:var(--era-ink)] transition hover:border-[color:var(--era-accent)] hover:text-[color:var(--era-accent)] disabled:opacity-50"
            >
              {p.text}
            </button>
          ))}
        </div>
        {/* Staleness is shown, never hidden — a bot that looks live while
            running on old lore is the credibility failure we are avoiding. */}
        <p className="mt-3 text-xs text-[color:var(--era-ink-soft)]">
          Rumour file last swept {freshness.updatedOn} ({freshness.ageDays}{' '}
          {freshness.ageDays === 1 ? 'day' : 'days'} ago).{' '}
          {freshness.liveCount === 0
            ? 'Nothing live in the last fortnight, so these are the evergreens — I would rather say that than pretend.'
            : `${freshness.liveCount} live item${freshness.liveCount === 1 ? '' : 's'} in the last fortnight.`}
        </p>
      </div>

      <div ref={resultsRef} className="scroll-mt-24">
        {error && (
          <p role="status" className="mt-8 text-sm text-[color:var(--era-ink-soft)]">
            {error}
          </p>
        )}

        {(result?.kind === 'refusal' || result?.kind === 'empty') && (
          <p
            role="status"
            className="mt-8 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-5 leading-relaxed text-[color:var(--era-ink)]"
          >
            {result.message}
          </p>
        )}

        {result?.kind === 'take' && (
          <section role="status" className="mt-8" aria-label="Clownbot's take">
            {result.theoryName && (
              <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
                {result.theoryName}
              </h2>
            )}
            <p className="mt-3 text-lg leading-relaxed text-[color:var(--era-ink)]">{result.stance}</p>

            <dl className="mt-5 space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  For
                </dt>
                <dd className="mt-1 leading-relaxed text-[color:var(--era-ink)]">{result.argument}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  Against
                </dt>
                <dd className="mt-1 leading-relaxed text-[color:var(--era-ink)]">{result.counterpoint}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Meter label={EVIDENCE_LABEL} value={result.grade.evidence} max={MAX_EVIDENCE} />
                <Meter label={DELULU_LABEL} value={result.grade.delulu} max={MAX_DELULU} />
              </div>
              <p className="mt-4 text-sm text-[color:var(--era-ink)]">
                <span className="font-medium">{result.grade.label}.</span> {CONFIDENCE_LABEL}:{' '}
                {result.grade.confidence}%. {result.grade.rationale}
              </p>
              <p className="mt-2 text-xs text-[color:var(--era-ink-soft)]">{METER_NOTE}</p>
            </div>

            {result.receipts.length > 0 && (
              <section className="mt-6" aria-label={RECEIPTS_HEADING}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  {RECEIPTS_HEADING}
                </h3>
                <ul className="mt-2 space-y-3">
                  {result.receipts.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-[color:var(--era-line)] p-3.5 text-sm"
                    >
                      <p className="font-medium text-[color:var(--era-ink)]">
                        {r.title}{' '}
                        <span className="font-normal text-[color:var(--era-ink-soft)]">
                          · {r.dateLabel}
                          {r.status ? ` · ${r.status}` : ''}
                        </span>
                      </p>
                      <p className="mt-1 leading-relaxed text-[color:var(--era-ink-soft)]">{r.detail}</p>
                      {r.sources.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                          {r.sources.map((s) => (
                            <a
                              key={s.url}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block py-1 text-xs text-[color:var(--era-accent)] underline underline-offset-2"
                            >
                              {s.name}
                            </a>
                          ))}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.aside && (
              <p className="mt-5 leading-relaxed text-[color:var(--era-ink-soft)]">{result.aside}</p>
            )}
          </section>
        )}
      </div>

      {/* The canon — who this character is, stated up front rather than
          discovered. A bot with no opinions can only react. */}
      <section className="mt-14" aria-label="Who Clownbot is">
        <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
          Know your clown
        </h2>
        <dl className="mt-4 space-y-4">
          {CANON.map((entry) => (
            <div
              key={entry.label}
              className="rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-5"
            >
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {entry.label}
              </dt>
              <dd className="mt-2 leading-relaxed text-[color:var(--era-ink)]">{entry.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The ledger. Losses in public, on purpose. */}
      <section className="mt-12" aria-label={LEDGER_HEADING}>
        <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-ink)]">
          {LEDGER_HEADING}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">{LEDGER_NOTE}</p>
        <p className="mt-2 text-sm font-medium text-[color:var(--era-ink)]">{wigLine}</p>
        <ul className="mt-4 space-y-3">
          {ledger.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[color:var(--era-line)] p-4 text-sm">
              <p className="flex flex-wrap items-baseline gap-2">
                <span
                  className={
                    entry.verdict === 'clowned'
                      ? 'rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-ink-soft)]'
                      : 'rounded-full bg-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--era-bg)]'
                  }
                >
                  {entry.verdict}
                </span>
                <span className="text-xs text-[color:var(--era-ink-soft)]">{entry.when}</span>
              </p>
              <p className="mt-2 leading-relaxed text-[color:var(--era-ink)]">{entry.theory}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {entry.sources.slice(0, 2).map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 text-xs text-[color:var(--era-accent)] underline underline-offset-2"
                  >
                    {s.name}
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">{UNOFFICIAL_NOTICE}</p>
    </div>
  );
}
