'use client';

/**
 * The combined Community section (PLAN.md 2026-08-14 steps 1-2 — Joey: "we're
 * going to drop merch from nav and combine community and merch... a 50/50
 * split button that goes all the way across the screen"). This file now owns
 * the section SHELL — the "Community" H1, the full-width 50/50 Social/Merch
 * toggle, and the sticky mini-toggle rail — and mounts either the Social pane
 * (this file's own directory content, below) or `MerchSection` depending on
 * `communityTab` in the store. Merch no longer has its own top-level nav
 * destination or page frame; it is a pane inside this one.
 *
 * THE CHROME RULE (non-negotiable, from the design): exactly one sticky
 * element at a time. The H1, the big 48px toggle, and each pane's own content
 * all sit in normal flow and scroll away. A single 44px rail then pins under
 * the TopBar — appearing exactly when the big toggle leaves the viewport
 * (IntersectionObserver against the toggle, with the topbar's own live height
 * as the intersection margin so "leaves the viewport" accounts for what the
 * sticky TopBar already covers) — so there is never a frame with both
 * visible. The rail's jump-chips slot is left empty here for a later step
 * (PLAN.md step 3, SectionJumpBar) to fill.
 *
 * Sticky offset reuses FilterBar's own `data-ll-topbar` ResizeObserver
 * pattern (TopBar's height is responsive, so a hardcoded top value drifts).
 *
 * Every community entry carries an honest confidence signal. `memberCount` is
 * `null` for several entries by design (Reddit blocks automated access, so no
 * count exists) — that renders nothing, never "0" or an estimate. Anything
 * short of `verification.status === 'verified-live'` gets a quiet marker
 * rather than being presented as equally confirmed, and any real `flags` (an
 * impersonator spin-off, a subreddit that reportedly went private) render
 * more prominently than the description, since they matter more.
 *
 * `@/lib/longlive/communities.ts` already groups by platform
 * (`communitiesByPlatform`), each group sorted by hypeScore descending, group
 * order following first appearance in the source data — this file just
 * renders that grouping.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, ShieldQuestion } from 'lucide-react';
import { COMMUNITIES, communitiesByPlatform, type Community } from '@/lib/longlive/communities';
import { getEra } from '@/lib/longlive/eras';
import { MERCH_CATALOGUE } from '@/lib/longlive/merch';
import { merchByEra } from '@/lib/longlive/merch-filters';
import {
  communityGroupsToChips,
  communityPlatformSectionId,
  communitySummary,
  merchGroupsToChips,
  merchSummary,
  suggestLinkSectionId,
} from '@/lib/longlive/section-jump';
import { useAppActions, useAppState, type CommunityTab } from '@/lib/longlive/store';
import { SegmentedToggle, type SegmentedToggleOption } from './SegmentedToggle';
import { SectionJumpBar } from './SectionJumpBar';
import { SubmitLinkForm } from './SubmitLinkForm';
import { MerchSection } from './MerchSection';

type VerificationStatus = Community['verification']['status'];

const VERIFICATION_LABEL: Partial<Record<VerificationStatus, string>> = {
  'third-party-cited': 'Reported by a third party — not independently verified',
  'listed-only': 'Listed only — lowest confidence',
  'blocked-unverified': 'Unconfirmed — platform blocks verification',
};

const TAB_OPTIONS: readonly SegmentedToggleOption<CommunityTab>[] = [
  { value: 'social', label: 'Social' },
  { value: 'merch', label: 'Merch' },
];

// SSR-render seed only, overwritten before paint — see FilterBar.tsx, whose
// ResizeObserver pattern this mirrors.
const TOPBAR_RESTING_HEIGHT = 52;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Live height of the sticky TopBar, kept in sync via ResizeObserver. */
function useTopbarHeight(): number {
  const [top, setTop] = useState(TOPBAR_RESTING_HEIGHT);
  useIsomorphicLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-ll-topbar]');
    if (!header) return;
    const update = () => setTop(header.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  return top;
}

export function CommunitySection() {
  const { communityTab: tab } = useAppState();
  const { setCommunityTab } = useAppActions();
  const toggleRef = useRef<HTMLDivElement>(null);
  const [railVisible, setRailVisible] = useState(false);
  const topbarHeight = useTopbarHeight();

  // Compact-rail jump-chip data for both panes, computed here once (the
  // rail is CommunitySection's own, not either pane's) from the same pure
  // helpers each pane uses for its own rest-state bar — see section-jump.ts.
  const socialChips = useMemo(() => communityGroupsToChips(communitiesByPlatform()), []);
  const socialSummaryText = useMemo(
    () => communitySummary(COMMUNITIES.length, socialChips.length),
    [socialChips.length],
  );
  const merchChips = useMemo(
    () => merchGroupsToChips(merchByEra(), (eraId) => getEra(eraId).theme.accent),
    [],
  );
  const merchSummaryText = useMemo(
    () => merchSummary(MERCH_CATALOGUE.shopTheLook.length, merchChips.length),
    [merchChips.length],
  );

  // The rail appears exactly when the big toggle scrolls out from under the
  // TopBar — never while it's still visible (never two toggles on screen).
  useEffect(() => {
    const el = toggleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setRailVisible(!entry.isIntersecting),
      { rootMargin: `-${topbarHeight}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [topbarHeight]);

  return (
    <>
      {railVisible && (
        <div
          data-ll-community-rail
          className="sticky z-30 flex h-11 items-center gap-3 border-b border-[color:var(--era-line)] bg-[color:var(--era-bg)]/90 px-4 backdrop-blur-xl md:px-6"
          style={{ top: topbarHeight }}
        >
          <SegmentedToggle
            ariaLabel="Community section"
            size="compact"
            options={TAB_OPTIONS}
            value={tab}
            onChange={setCommunityTab}
            className="w-auto max-w-[180px] shrink-0"
          />
          <div data-ll-jump-chips-slot className="min-w-0 flex-1 overflow-hidden">
            {tab === 'merch' ? (
              <SectionJumpBar
                ariaLabel="Jump to merch era"
                variant="compact"
                summary={merchSummaryText}
                chips={merchChips}
                suggestChip={{ id: suggestLinkSectionId('merch'), label: '+ Suggest a link' }}
              />
            ) : (
              <SectionJumpBar
                ariaLabel="Jump to platform"
                variant="compact"
                summary={socialSummaryText}
                chips={socialChips}
                suggestChip={{ id: suggestLinkSectionId('community'), label: '+ Suggest a link' }}
              />
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
        <h1 className="font-[family-name:var(--era-font)] text-3xl font-semibold text-[color:var(--era-ink)]">
          Community
        </h1>

        <div ref={toggleRef} className="mt-6">
          <SegmentedToggle
            ariaLabel="Community section"
            options={TAB_OPTIONS}
            value={tab}
            onChange={setCommunityTab}
          />
        </div>

        <div className="mt-8">{tab === 'merch' ? <MerchSection /> : <SocialPane />}</div>
      </div>
    </>
  );
}

function SocialPane() {
  const groups = Array.from(communitiesByPlatform());
  const chips = useMemo(() => communityGroupsToChips(groups), [groups]);
  const summaryText = communitySummary(COMMUNITIES.length, chips.length);

  return (
    <>
      <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        Where Swifties gather, grouped by platform. Curated by hand — this grows with fan submissions over time,
        not all at once.
      </p>

      {chips.length > 0 && (
        <div className="mt-6">
          <SectionJumpBar
            ariaLabel="Jump to platform"
            variant="rest"
            summary={summaryText}
            chips={chips}
            suggestChip={{ id: suggestLinkSectionId('community'), label: '+ Suggest a link' }}
          />
        </div>
      )}

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--era-ink-soft)]">Nothing listed yet — check back soon.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map(([platform, communities]) => (
            <section key={platform} id={communityPlatformSectionId(platform)} aria-label={platform}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                {platform}
              </h2>
              <ul className="mt-3 grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
                {communities.map((c) => (
                  <CommunityCard key={c.url} community={c} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div id={suggestLinkSectionId('community')}>
        <SubmitLinkForm section="community" />
      </div>
    </>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const status = community.verification?.status;
  const unverifiedLabel = status && status !== 'verified-live' ? VERIFICATION_LABEL[status] : undefined;
  const flags = community.flags ?? [];

  return (
    <li className="era-card min-h-[44px] rounded-2xl border p-4">
      <p className="text-sm font-semibold text-[color:var(--era-ink)]">{community.name}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-[color:var(--era-ink-soft)]">
        {community.niche}
        {community.memberCount != null && ` · ${community.memberCount.toLocaleString()} members`}
      </p>

      <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{community.description}</p>

      {flags.length > 0 && (
        <div className="mt-2.5 rounded-lg border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-2.5">
          <ul className="space-y-1">
            {flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed text-[color:var(--era-ink)]">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--era-accent)]"
                  aria-hidden="true"
                />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {unverifiedLabel && (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs text-[color:var(--era-ink-soft)]">
          <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {unverifiedLabel}
        </p>
      )}

      <a
        href={community.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[color:var(--era-accent)] underline-offset-2 hover:underline"
      >
        Visit
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </li>
  );
}
