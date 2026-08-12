'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import {
  eraSecretsForEra,
  dailyEraSecret,
  resolveEraSecretLink,
} from '@/lib/longlive/era-secrets';
import { trackKey } from './TrackDetail';
import type { EraId } from '@/lib/longlive/types';

/** The viewer's local calendar day as `YYYY-MM-DD`. Client-only (see below). */
function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * The Era Secret card (#688): the first thing inside every era, greeting the
 * entry with one delightful, genuinely-obscure, SOURCED fact. Rendered in the
 * era's own visual language (the shared `era-card`/era-token grammar — no new
 * component style), and links deeper into the site when the secret names a
 * target it can resolve.
 *
 * The pick rotates on a deterministic daily cycle (same secret for everyone on
 * a given day — a curated feel + a return hook, zero runtime LLM). The day is
 * read on the CLIENT only: the first render (SSR + hydration) shows the pool's
 * first secret so the markup matches, then an effect swaps in the day's pick.
 * The card shape is identical either way, so it's a text swap with no layout
 * shift — and no hydration mismatch around a midnight boundary.
 */
export function EraSecretCard({ eraId }: { eraId: EraId }) {
  const { openSong, openItem } = useAppActions();
  const pool = eraSecretsForEra(eraId);
  const [dayKey, setDayKey] = useState<string | null>(null);
  useEffect(() => setDayKey(todayKey()), []);

  if (pool.length === 0) return null;
  const secret = dayKey ? dailyEraSecret(eraId, dayKey)! : pool[0];

  const link = resolveEraSecretLink(secret.deeperLink);
  const deeper = link
    ? link.kind === 'song'
      ? {
          label: `Hear more: ${link.track.title}`,
          onClick: () => openSong(link.eraId, trackKey(link.eraId, link.track)),
        }
      : {
          label: 'See the moment',
          onClick: () => openItem(link.item.id),
        }
    : null;

  return (
    <section
      aria-label={`Era secret — ${secret.title}`}
      className="mx-auto max-w-4xl px-4 pt-6 md:pr-8"
    >
      <div className="era-card rounded-2xl border p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--era-accent)]" aria-hidden />
          Era secret
        </div>
        <h2 className="mt-2 font-[family-name:var(--era-font)] text-balance text-2xl font-semibold leading-snug sm:text-3xl">
          {secret.title}
        </h2>
        <p className="mt-2.5 text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)]">
          {secret.secret}
        </p>

        {deeper && (
          <button
            onClick={deeper.onClick}
            className="era-btn-ghost mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            {deeper.label}
            <ArrowUpRight className="h-4 w-4 text-[color:var(--era-accent)]" aria-hidden />
          </button>
        )}

        {secret.sources.length > 0 && (
          <p className="mt-4 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
            {secret.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
            {secret.sources.map((s, i) => (
              <span key={`${s.url}-${i}`}>
                {i > 0 && ', '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                >
                  {s.name}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
