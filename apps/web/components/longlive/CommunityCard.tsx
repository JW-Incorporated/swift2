'use client';

/**
 * A single community card — Direction A "Signal Board" (Joey 2026-08-15,
 * approved from `community-mockup.html`). Split out of CommunitySection.tsx
 * to keep that file under the ~300-line guideline once the card grew a
 * member-count anchor, a designed null state, description clamping, and a
 * verification footer.
 *
 * The member count is the visual anchor (large tabular numerals), not the
 * platform label — `hypeScore` (already computed per platform in
 * `communitiesByPlatform`) decides which single card per group renders
 * `featured`, at greater visual weight. Nothing here fetches the community's
 * URL (no favicons, no OG images, no link previews — a documented no-go) and
 * nothing a user submits ever renders here (issue #36).
 *
 * `memberCount` is `null` for 15 of 30 entries by design (e.g. Reddit blocks
 * automated access). That NEVER renders "0" or an estimate — the null state
 * gets its own designed slot (an em-dash at the same optical size a real
 * number would occupy) so the card doesn't read as broken.
 */

import { useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { Community, CommunityPlatform, VerificationStatus } from '@/lib/longlive/communities';

const MONOGRAM: Record<CommunityPlatform, string> = {
  Discord: 'D',
  Reddit: 'R',
  Forum: 'Fo',
  Facebook: 'Fb',
  Tumblr: 'Tu',
  AO3: 'AO3',
  Steam: 'St',
  Wattpad: 'Wp',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO `YYYY-MM-DD` → "14 Aug", parsed manually rather than via `Date` so a
 *  reader's negative-UTC-offset timezone never rolls the date back a day. */
function formatCheckedDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  const month = parts[1];
  const day = parts[2];
  if (!month || !day || !MONTHS[month - 1]) return iso;
  return `${day} ${MONTHS[month - 1]}`;
}

const VERIFICATION_COPY: Record<VerificationStatus, { icon: string; label: string }> = {
  'verified-live': { icon: '✓', label: 'Verified live' },
  'third-party-cited': { icon: '◇', label: 'Reported by a third party' },
  'listed-only': { icon: '◇', label: 'Listed only' },
  'blocked-unverified': { icon: '◇', label: 'Unconfirmed — platform blocks verification' },
};

export function CommunityCard({ community, featured }: { community: Community; featured: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasCount = community.memberCount != null;
  const monogram = MONOGRAM[community.platform];
  const verif = VERIFICATION_COPY[community.verification.status];
  const checkedLabel = formatCheckedDate(community.verification.checkedAt);
  const flags = community.flags ?? [];
  const bigStatSize = featured ? 'text-[38px]' : 'text-[30px]';

  return (
    <li
      className={`era-card relative min-h-[44px] rounded-2xl border p-4 ${featured ? 'md:col-span-2' : ''}`}
      style={
        featured
          ? {
              background: 'linear-gradient(180deg, var(--era-surface-2), var(--era-surface))',
              borderColor: 'color-mix(in srgb, var(--era-accent) 32%, var(--era-line))',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border text-[13px] font-semibold"
          style={
            featured
              ? { background: 'var(--era-ink)', color: 'var(--era-bg)', borderColor: 'var(--era-ink)' }
              : !hasCount
                ? { borderStyle: 'dashed', borderColor: 'var(--era-line)', color: 'var(--era-ink-soft)' }
                : {
                    background: 'color-mix(in srgb, var(--era-accent) 8%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--era-accent) 22%, var(--era-line))',
                    color: 'var(--era-ink)',
                  }
          }
        >
          <span className="font-[family-name:var(--era-font)]">{monogram}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-[color:var(--era-ink)]">{community.name}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[color:var(--era-ink-soft)]">
            {community.platform} · {community.niche}
          </p>
        </div>
      </div>

      {hasCount ? (
        <div className="mt-3 flex flex-wrap items-end gap-3.5">
          <div>
            <div
              className={`font-[family-name:var(--era-font)] font-semibold leading-none tabular-nums text-[color:var(--era-ink)] ${bigStatSize}`}
            >
              {community.memberCount!.toLocaleString()}
            </div>
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
              members
            </span>
          </div>
          {community.onlineCount != null ? (
            <span className="inline-flex items-center gap-1.5 pb-0.5 text-xs tabular-nums text-[color:var(--era-ink)]">
              <span
                aria-hidden
                className="h-[7px] w-[7px] rounded-full"
                style={{
                  background: 'var(--era-accent)',
                  boxShadow: '0 0 0 3px color-mix(in srgb, var(--era-accent) 16%, transparent)',
                }}
              />
              {community.onlineCount.toLocaleString()}{' '}
              <small className="text-[color:var(--era-ink-soft)]">online</small>
            </span>
          ) : (
            <span className="pb-0.5 text-xs text-[color:var(--era-ink-soft)]">{community.activityLevel} activity</span>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3.5">
          <div>
            <div
              className={`font-[family-name:var(--era-font)] font-semibold leading-none ${bigStatSize}`}
              style={{ color: 'color-mix(in srgb, var(--era-ink-soft) 55%, transparent)' }}
            >
              —
            </div>
            <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
              no public count
            </span>
          </div>
          <span className="max-w-[24ch] pb-0.5 text-xs leading-snug text-[color:var(--era-ink)]">
            {community.activityLevel === 'unknown'
              ? 'Activity unknown — not independently verifiable.'
              : `${community.activityLevel} activity, no member count available.`}
          </span>
        </div>
      )}

      <div className="mt-3">
        <p className={`text-sm leading-relaxed text-[color:var(--era-ink-soft)] ${expanded ? '' : 'line-clamp-2'}`}>
          {community.description}
        </p>
        {expanded && (
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
            <span className="text-[color:var(--era-ink)]">Activity —</span> {community.activityEvidence}
          </p>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 inline-flex min-h-[44px] items-center border-b text-xs text-[color:var(--era-ink)]"
          style={{ borderColor: 'var(--era-line)' }}
        >
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {flags.length > 0 && (
        <div
          className="mt-1 rounded-lg border border-l-[3px] p-2.5"
          style={{
            borderColor: 'color-mix(in srgb, var(--era-accent) 26%, var(--era-line))',
            background: 'color-mix(in srgb, var(--era-accent) 5%, transparent)',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--era-ink-soft)]">
            {flags.length === 1 ? 'Before you join' : `${flags.length} cautions`}
          </p>
          <ul className="mt-1 space-y-1">
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

      <div
        className="mt-3 flex min-h-[44px] items-center justify-between gap-2.5 border-t pt-2.5"
        style={{ borderColor: 'var(--era-line)' }}
      >
        <span className="inline-flex max-w-[21ch] items-start gap-1.5 text-[11px] leading-snug text-[color:var(--era-ink-soft)]">
          <span aria-hidden className="text-xs text-[color:var(--era-ink)]">
            {verif.icon}
          </span>
          {verif.label} · checked {checkedLabel}
        </span>
        <a
          href={community.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold"
          style={
            hasCount
              ? { background: 'var(--era-ink)', color: 'var(--era-bg)' }
              : { background: 'transparent', color: 'var(--era-ink)', border: '1px solid var(--era-line)' }
          }
        >
          Visit
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}
