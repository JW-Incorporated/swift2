'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { VaultSkeleton } from '@swift2/core';
import { orderedEras } from '@swift2/shared';
import { eraSkin } from '../../lib/theme';
import { useMoment } from '../../lib/useMoment';
import { useTrackGuide } from '../../lib/useTrackGuide';
import { MomentDetail } from '../MomentDetail';
import { TrackGuide } from '../TrackGuide';
import { EraSection } from './EraContent';
import { buildModel } from './scrubberModel';
import { VARIANTS, type ScrubberProps, type VariantId } from './types';
import { ScrubberA } from './variants/ScrubberA';
import { ScrubberB } from './variants/ScrubberB';
import { ScrubberC } from './variants/ScrubberC';
import { ScrubberD } from './variants/ScrubberD';

const HEADER_OFFSET = 0.2; // matches DETECTOR in scrubberModel

const SCRUBBERS: Record<VariantId, (p: ScrubberProps) => JSX.Element> = {
  A: ScrubberA,
  B: ScrubberB,
  C: ScrubberC,
  D: ScrubberD,
};

/**
 * The demo reader body — a faithful clone of production's VaultReader scroll
 * surface (continuous era timeline, era re-skin, moment + track modals) with the
 * scrubber factored OUT into a swappable slot. Every variant renders against
 * this same body and the same real Vault data; only the navigator differs.
 */
export function ReaderShell({ skeleton, variant }: { skeleton: VaultSkeleton; variant: VariantId }) {
  const eras = useMemo(() => orderedEras(skeleton.eras), [skeleton.eras]);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, eras.length - 1));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(activeIndex);
  const moment = useMoment();
  const trackGuide = useTrackGuide();

  const model = useMemo(
    () => buildModel(eras, skeleton.monthItems, skeleton.milestones),
    [eras, skeleton.monthItems, skeleton.milestones],
  );

  const jumpToEra = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Land on the most recent era, same as production.
  useEffect(() => {
    sectionRefs.current[eras.length - 1]?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-spy: coarse active era for the era skin + labels (≤1 setState/boundary).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    let ticking = false;
    const compute = () => {
      ticking = false;
      const line = root.scrollTop + root.clientHeight * HEADER_OFFSET;
      let idx = 0;
      for (let i = 0; i < sectionRefs.current.length; i += 1) {
        const el = sectionRefs.current[i];
        if (el && el.offsetTop <= line) idx = i;
      }
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [eras.length]);

  const active = eras[activeIndex] ?? eras[0];

  const openItem = moment.state.itemId
    ? (skeleton.monthItems.find((it) => it.id === moment.state.itemId) ?? null)
    : null;

  const Scrubber = SCRUBBERS[variant];
  const scrubberProps: ScrubberProps = {
    eras,
    milestones: skeleton.milestones,
    monthItems: skeleton.monthItems,
    model,
    activeIndex,
    scrollRef,
    sectionRefs,
    onJumpToEra: jumpToEra,
  };

  if (!active) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <VariantSwitcher current={variant} />
        <main style={{ padding: '3rem', fontFamily: 'system-ui' }}>
          No Vault data in this environment. On the Vercel preview (with the database
          connected) every variant renders the real eras. Locally this falls back to empty.
        </main>
      </div>
    );
  }

  return (
    <div
      className="era-skin"
      style={{ ...eraSkin(active.theme), position: 'relative', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      <div
        ref={scrollRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          overflowY: 'auto',
          background: 'var(--bg)',
        }}
      >
        {eras.map((era, i) => (
          <section
            key={era.slug}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            data-era={era.slug}
            style={eraSkin(era.theme)}
          >
            <EraSection
              era={era}
              tint={era.theme.bg}
              nextTint={eras[i + 1]?.theme.bg ?? era.theme.bg}
              milestones={skeleton.milestones.filter((m) => m.eraSlug === era.slug)}
              items={skeleton.monthItems.filter((it) => it.eraSlug === era.slug)}
              onOpen={moment.open}
              onOpenTracks={() => trackGuide.open(era.slug, era.album)}
            />
          </section>
        ))}
      </div>

      <Scrubber {...scrubberProps} />

      <VariantSwitcher current={variant} />

      <MomentDetail
        state={moment.state}
        title={openItem?.title ?? ''}
        onClose={moment.close}
        onRetry={() => {
          if (moment.state.itemId) moment.open(moment.state.itemId);
        }}
      />
      <TrackGuide
        state={trackGuide.state}
        onClose={trackGuide.close}
        onRetry={() => {
          if (trackGuide.state.status !== 'idle') trackGuide.open(trackGuide.state.eraSlug, trackGuide.state.album);
        }}
      />
    </div>
  );
}

/**
 * Slim always-on switcher so Joey can flip between the four variants on one
 * preview URL without going back to the index. Parked top-left as a small glass
 * pill row; clear of variant A's right edge and variant D's top-center lozenge.
 */
function VariantSwitcher({ current }: { current: VariantId }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: 8,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'rgba(17,17,22,0.6)',
        backdropFilter: 'blur(10px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Link
        href="/demo/scrubber"
        aria-label="All variants"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 999,
          color: 'rgba(255,255,255,0.85)',
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        ☰
      </Link>
      {VARIANTS.map((v) => {
        const on = v.id === current;
        return (
          <Link
            key={v.id}
            href={`/demo/scrubber/${v.slug}`}
            aria-label={`${v.name} variant`}
            aria-current={on ? 'page' : undefined}
            title={`${v.id} · ${v.name}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 999,
              color: on ? '#111' : 'rgba(255,255,255,0.85)',
              background: on ? '#fff' : 'transparent',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            {v.id}
          </Link>
        );
      })}
    </div>
  );
}
