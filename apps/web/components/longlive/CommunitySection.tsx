'use client';

/**
 * The directory of fan communities (PLAN.md, Joey 2026-08-14) — a curated
 * list Joey builds by hand and grows with fan submissions over time, grouped
 * by platform since that's how the underlying research frames it (item 4b).
 * This is a directory page, not a chat surface: the era palette applies, not
 * ClownChat.tsx's neutral app chrome.
 *
 * Rebuilt 2026-08-15 to Direction A "Signal Board" (Joey's item #6 — "just
 * looks kinda boring") plus Direction B's chapter standfirst headings, per
 * `community-mockup.html`. The card itself lives in `CommunityCard.tsx` —
 * split out to keep this file under the ~300-line guideline. See that file's
 * header for what changed there (member count as visual anchor, the
 * designed null-count state, description clamping, the verification
 * footer). `PLATFORM_STANDFIRST` below is Direction B's contribution: one
 * line of editorial voice under each platform heading.
 *
 * `@/lib/longlive/section-jump.ts` groups the same `communitiesByPlatform()`
 * data into jump chips with counts, so the page opens with a rest-state jump
 * bar showing how much is here before scrolling.
 *
 * `@/lib/longlive/communities.ts` already groups by platform
 * (`communitiesByPlatform`), each group sorted by hypeScore descending,
 * group order following first appearance in the source data — this file
 * just renders that grouping, marking the first (highest-hype) entry in
 * each group `featured`.
 */

import { COMMUNITIES, communitiesByPlatform, type CommunityPlatform } from '@/lib/longlive/communities';
import {
  communityGroupsToChips,
  communityPlatformSectionId,
  communitySummary,
  suggestLinkSectionId,
} from '@/lib/longlive/section-jump';
import { CommunityCard } from './CommunityCard';
import { SectionJumpBar, SuggestLinkBanner } from './SectionJumpBar';
import { SubmitLinkForm } from './SubmitLinkForm';

/** Direction B's contribution to the approved design (Joey 2026-08-15):
 *  one line of voice under each platform heading. Copy authored by the
 *  orchestrator, not Joey — he may want to rewrite it. */
const PLATFORM_STANDFIRST: Record<CommunityPlatform, string> = {
  Discord: 'Where the fandom talks in real time. These servers never really go quiet.',
  Reddit: 'Threads that run for days, and a comment section that does the research.',
  Tumblr: 'Where the theories are born, in essay form, usually at 2am.',
  Facebook: 'The long-running groups. Often the oldest rooms in the fandom.',
  Forum: 'Old-school message boards, still going. Slower, deeper, properly archived.',
  AO3: 'Fan fiction archived properly: tagged, sorted, and taken seriously.',
  Wattpad: 'Stories written chapter by chapter, with an audience already waiting.',
  Steam: 'An unlikely corner: Swifties gathering where the games are.',
};

export function CommunitySection() {
  const groups = Array.from(communitiesByPlatform());
  const chips = communityGroupsToChips(groups);
  const summaryText = communitySummary(COMMUNITIES.length, chips.length);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
      <header>
        <h1 className="font-[family-name:var(--era-font)] text-3xl font-semibold text-[color:var(--era-ink)]">
          Fan communities
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          Where Swifties gather, grouped by platform. Curated by hand — this grows with fan submissions over time,
          not all at once.
        </p>
      </header>

      <div className="mt-5">
        <SuggestLinkBanner id={suggestLinkSectionId('community')} label="Know a community we should add? Suggest it" />
      </div>

      {chips.length > 0 && (
        <div className="mt-6">
          <SectionJumpBar
            ariaLabel="Jump to platform"
            variant="rest"
            summary={summaryText}
            chips={chips}
          />
        </div>
      )}

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--era-ink-soft)]">Nothing listed yet — check back soon.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map(([platform, communities]) => (
            <section key={platform} id={communityPlatformSectionId(platform)} aria-label={platform}>
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  {platform}
                </h2>
                <span className="font-mono text-[11px] tabular-nums text-[color:var(--era-accent-2)]">
                  {communities.length}
                </span>
                <span aria-hidden className="h-px flex-1 bg-[color:var(--era-line)]" />
              </div>
              <p className="mt-2 max-w-[54ch] text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
                {PLATFORM_STANDFIRST[platform]}
              </p>
              <ul className="mt-3 grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4">
                {communities.map((c, i) => (
                  <CommunityCard key={c.url} community={c} featured={i === 0} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div id={suggestLinkSectionId('community')}>
        <SubmitLinkForm section="community" />
      </div>
    </div>
  );
}
