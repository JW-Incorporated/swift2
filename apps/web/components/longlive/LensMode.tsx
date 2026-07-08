'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Shirt, RefreshCw, Sparkles, Music } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { ERAS, getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import {
  RELATIONSHIPS,
  RUNWAY_LOOKS,
  RERECORDS,
  EGG_NODES,
  EGG_LINKS,
} from '@/lib/longlive/lenses';
import type { LensId } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';

const LENSES: { id: LensId; label: string; icon: typeof Heart }[] = [
  { id: 'love-story', label: 'Love Story', icon: Heart },
  { id: 'fashion', label: 'Fashion Runway', icon: Shirt },
  { id: 'taylors-version', label: "Taylor's Version", icon: RefreshCw },
  { id: 'easter-eggs', label: 'Easter Egg Web', icon: Sparkles },
];

export function LensMode() {
  const [lens, setLens] = useState<LensId>('love-story');

  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-6">
      {/* Lens switcher */}
      <div className="mb-8 flex flex-wrap gap-2">
        {LENSES.map((l) => {
          const Icon = l.icon;
          const active = lens === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setLens(l.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                active
                  ? 'border-transparent bg-[color:var(--era-accent)] text-[color:var(--era-bg)]'
                  : 'border-[color:var(--era-line)] text-[color:var(--era-ink-soft)] hover:text-[color:var(--era-ink)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {l.label}
            </button>
          );
        })}
      </div>

      <div key={lens} className="era-enter">
        {lens === 'love-story' && <LoveStoryLens />}
        {lens === 'fashion' && <FashionLens />}
        {lens === 'taylors-version' && <TaylorsVersionLens />}
        {lens === 'easter-eggs' && <EasterEggLens />}
      </div>
    </div>
  );
}

function LensHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <header className="mb-6">
      <h2 className="font-era text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
        {blurb}
      </p>
    </header>
  );
}

/* ── Love Story: relationships mapped across eras ─────────────────── */
function LoveStoryLens() {
  return (
    <div>
      <LensHeader
        title="Love Story"
        blurb="The muses and heartbreaks threaded through the catalog — and the eras each one colored."
      />
      <div className="space-y-4">
        {RELATIONSHIPS.map((rel) => {
          const start = new Date(rel.start).getFullYear();
          const end = rel.end ? new Date(rel.end).getFullYear() : 'now';
          return (
            <article key={rel.id} className="era-card rounded-2xl border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-era text-xl font-semibold">{rel.name}</h3>
                <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                  {start} – {end}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                {rel.note}
              </p>

              {/* Era chips */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {rel.eraIds.map((id) => {
                  const era = getEra(id);
                  return (
                    <span
                      key={id}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: era.theme.accent,
                        color: era.theme.accent,
                        backgroundColor: `color-mix(in srgb, ${era.theme.accent} 12%, transparent)`,
                      }}
                    >
                      {era.shortName}
                    </span>
                  );
                })}
              </div>

              {/* Songs */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--era-ink)]">
                {rel.songs.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
                    {s}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fashion Runway: horizontal scroll of era looks ───────────────── */
function FashionLens() {
  return (
    <div>
      <LensHeader
        title="Fashion Runway"
        blurb="Every era wore its story. Scroll the runway of signature looks — each tile carries its era's palette."
      />
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4">
        {RUNWAY_LOOKS.map((look) => {
          const era = getEra(look.eraId);
          return (
            <article
              key={look.id}
              style={eraStyle(era)}
              className="era-card w-64 shrink-0 snap-center overflow-hidden rounded-2xl border"
            >
              <div className="relative aspect-[3/4]">
                <Image src={look.image || '/placeholder.svg'} alt="" fill className="object-cover" />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, var(--era-bg), transparent 60%)',
                  }}
                />
                <span className="absolute bottom-2 left-3 font-era text-lg font-semibold text-[color:var(--era-ink)]">
                  {era.shortName}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-era text-base font-semibold">{look.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                  {look.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {look.shopTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[11px] text-[color:var(--era-ink-soft)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ── Taylor's Version: reclamation progress ───────────────────────── */
function TaylorsVersionLens() {
  const reclaimed = RERECORDS.filter((r) => r.reclaimedYear).length;
  const totalVault = RERECORDS.reduce((n, r) => n + r.vaultTracks, 0);
  return (
    <div>
      <LensHeader
        title="Taylor's Version"
        blurb="The reclamation project — album by album, reclaiming the masters and unlocking vault tracks along the way."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Albums reclaimed" value={`${reclaimed} / ${RERECORDS.length}`} />
        <Stat label="Vault tracks freed" value={String(totalVault)} />
        <Stat label="Still awaiting" value={String(RERECORDS.length - reclaimed)} />
      </div>

      <div className="space-y-3">
        {RERECORDS.map((r) => {
          const done = Boolean(r.reclaimedYear);
          return (
            <article
              key={r.id}
              className="era-card flex items-center gap-4 rounded-2xl border p-4"
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                  done
                    ? 'border-transparent bg-[color:var(--era-accent)] text-[color:var(--era-bg)]'
                    : 'border-dashed border-[color:var(--era-line)] text-[color:var(--era-ink-soft)]',
                )}
              >
                {done ? '✓' : '…'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-era text-lg font-semibold">{r.album}</h3>
                  <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                    {r.originalYear}
                    {r.reclaimedYear ? ` → ${r.reclaimedYear}` : ' → pending'}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                  {r.note}
                </p>
                {r.vaultTracks > 0 && (
                  <span className="mt-2 inline-block rounded-full bg-[color:var(--era-surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--era-accent)]">
                    +{r.vaultTracks} vault tracks
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="era-card rounded-2xl border p-4 text-center">
      <div className="font-era text-3xl font-semibold text-[color:var(--era-accent)]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-[color:var(--era-ink-soft)]">
        {label}
      </div>
    </div>
  );
}

/* ── Easter Egg Web: SVG constellation of clues → payoffs ─────────── */
function EasterEggLens() {
  const [active, setActive] = useState<string | null>(null);
  const nodeById = (id: string) => EGG_NODES.find((n) => n.id === id)!;
  const activeNode = active ? nodeById(active) : null;

  return (
    <div>
      <LensHeader
        title="Easter Egg Web"
        blurb="Clues planted years apart, connected to the payoffs they foreshadowed. Tap a node to trace the thread."
      />

      <div className="era-card overflow-hidden rounded-2xl border">
        <div className="relative aspect-[16/10] w-full">
          <svg viewBox="0 0 100 62" className="h-full w-full" role="img" aria-label="Easter egg constellation">
            {/* Links */}
            {EGG_LINKS.map((link) => {
              const a = nodeById(link.from);
              const b = nodeById(link.to);
              const lit = active === link.from || active === link.to;
              return (
                <line
                  key={`${link.from}-${link.to}`}
                  x1={a.x}
                  y1={a.y * 0.62}
                  x2={b.x}
                  y2={b.y * 0.62}
                  stroke="var(--era-accent)"
                  strokeWidth={lit ? 0.6 : 0.25}
                  strokeOpacity={lit ? 0.9 : 0.35}
                  strokeDasharray="1.5 1.5"
                />
              );
            })}
            {/* Nodes */}
            {EGG_NODES.map((n) => {
              const era = getEra(n.eraId);
              const isActive = active === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y * 0.62})`}
                  onClick={() => setActive(isActive ? null : n.id)}
                  className="cursor-pointer"
                >
                  <circle
                    r={isActive ? 2.6 : n.kind === 'payoff' ? 2 : 1.5}
                    fill={n.kind === 'payoff' ? era.theme.accent : 'var(--era-bg)'}
                    stroke={era.theme.accent}
                    strokeWidth={0.4}
                  />
                  {n.kind === 'clue' && <circle r={0.6} fill={era.theme.accent} />}
                </g>
              );
            })}
          </svg>

          {/* Node labels as absolutely-positioned buttons for a11y + hit area */}
          {EGG_NODES.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(active === n.id ? null : n.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-medium transition"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                backgroundColor:
                  active === n.id ? 'var(--era-accent)' : 'color-mix(in srgb, var(--era-surface) 85%, transparent)',
                color: active === n.id ? 'var(--era-bg)' : 'var(--era-ink-soft)',
                border: '1px solid var(--era-line)',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Detail readout */}
        <div className="border-t border-[color:var(--era-line)] p-5">
          {activeNode ? (
            <div className="clue-reveal">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                <span
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${getEra(activeNode.eraId).theme.accent} 16%, transparent)`,
                    color: getEra(activeNode.eraId).theme.accent,
                  }}
                >
                  {getEra(activeNode.eraId).shortName} · {activeNode.year}
                </span>
                <span>{activeNode.kind === 'clue' ? 'Clue planted' : 'Payoff'}</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
                {activeNode.detail}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--era-ink-soft)]">
              Tap any node to reveal the clue it planted — or the payoff it became.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
