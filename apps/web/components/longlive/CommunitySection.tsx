'use client';

/**
 * The directory of fan communities (PLAN.md, Joey 2026-08-14) — a curated
 * list Joey builds by hand and grows with fan submissions over time, grouped
 * by platform since that's how the underlying research frames it (item 4b).
 * This is a directory page, not a chat surface: the era palette applies, not
 * ClownChat.tsx's neutral app chrome.
 *
 * Every entry carries an honest confidence signal. `memberCount` is `null`
 * for several entries by design (Reddit blocks automated access, so no count
 * exists) — that renders nothing, never "0" or an estimate. Anything short of
 * `verification.status === 'verified-live'` gets a quiet marker rather than
 * being presented as equally confirmed, and any real `flags` (an impersonator
 * spin-off, a subreddit that reportedly went private) render more prominently
 * than the description, since they matter more.
 *
 * `@/lib/longlive/communities.ts` (built in parallel by a sibling agent,
 * PLAN.md step 1) already groups by platform (`communitiesByPlatform`), each
 * group sorted by hypeScore descending, group order following first
 * appearance in the source data — this file just renders that grouping.
 */

import { AlertTriangle, ExternalLink, ShieldQuestion } from 'lucide-react';
import { communitiesByPlatform, type Community } from '@/lib/longlive/communities';
import { SubmitLinkForm } from './SubmitLinkForm';

type VerificationStatus = Community['verification']['status'];

const VERIFICATION_LABEL: Partial<Record<VerificationStatus, string>> = {
  'third-party-cited': 'Reported by a third party — not independently verified',
  'listed-only': 'Listed only — lowest confidence',
  'blocked-unverified': 'Unconfirmed — platform blocks verification',
};

export function CommunitySection() {
  const groups = Array.from(communitiesByPlatform());

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

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--era-ink-soft)]">Nothing listed yet — check back soon.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map(([platform, communities]) => (
            <section key={platform} aria-label={platform}>
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

      <SubmitLinkForm section="community" />
    </div>
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
