'use client';

/**
 * The merch directory, rebuilt to Joey's marquee mockup (PLAN.md, "Merch page
 * redesign to the marquee mockup", 2026-08-16). Composes five already-built
 * pieces into three sections:
 *
 *   - `MerchMarquee` — the flashing-bulb hero.
 *   - `MerchSectionRail` — sticky three-up nav with scrollspy, one entry per
 *     section below, each carrying that section's real count and accent.
 *   - `MerchStyleSection` — era filter + real filters + grid + pager for
 *     "Seen on Taylor" (the only populated bucket; owns its own state).
 *   - `MerchEmptyPanel` — the honest placeholder for the two empty buckets.
 *   - `.merch-shell` (globals.css) — the fixed palette (R3): merch opts out
 *     of era skinning, so every color reference here is a `--merch-*` token,
 *     never `--era-*`.
 *
 * R1 (do not re-litigate): the mockup's garment-type row (Outerwear/Knitwear/
 * …) has no data behind it — `merch-filters.ts` deliberately has no `kind`
 * field on `Product`. `MerchStyleSection` puts our real, WORKING filters in
 * that row's visual position instead — never a disabled or decorative control.
 *
 * `officialStore` / `fanMade` are genuinely empty (`merch.ts`) — both render
 * an honest `MerchEmptyPanel`, never a fabricated product; their rail counts
 * are the real 0.
 *
 * Sticky-offset call: `MerchSectionRail` is the only sticky element on this
 * page. Nothing below it (EraSpine, the filter row, the tally line, all
 * inside `MerchStyleSection`) is itself `position: sticky` — same as the
 * mockup, where only `.rail` sticks. So `chrome-offset.ts` needs no
 * `[data-ll-merchrail]` branch: there is no nested-sticky element that would
 * need to clear the rail's stuck height.
 */

import { type ReactNode, useState } from 'react';
import { hasAffiliateMerch, SHOP_DISCLOSURE } from '@/lib/longlive/shop';
import { MERCH_CATALOGUE, newDrops, type MerchItem } from '@/lib/longlive/merch';
import { suggestLinkSectionId } from '@/lib/longlive/section-jump';
import { SubmitLinkForm } from './SubmitLinkForm';
import { MerchMarquee } from './merch/MerchMarquee';
import { MerchSectionRail, type MerchRailSection } from './merch/MerchSectionRail';
import { MerchStyleSection } from './merch/MerchStyleSection';
import { MerchEmptyPanel } from './merch/MerchEmptyPanel';
import { MerchCard } from './merch/MerchCard';

const SECTION_OFFICIAL = 'merch-official';
const SECTION_FANMADE = 'merch-fanmade';
const SECTION_STYLE = 'merch-style';

const RAIL_SECTIONS: readonly MerchRailSection[] = [
  {
    id: SECTION_OFFICIAL,
    label: 'Official Shop',
    count: MERCH_CATALOGUE.officialStore.length,
    accent: 'var(--merch-gold)',
  },
  {
    id: SECTION_FANMADE,
    label: 'Fan Made',
    count: MERCH_CATALOGUE.fanMade.length,
    accent: 'var(--merch-rose)',
  },
  {
    id: SECTION_STYLE,
    label: 'Her Style',
    count: MERCH_CATALOGUE.shopTheLook.length,
    accent: 'var(--merch-lilac)',
  },
];

function MerchSectionHead({
  accent,
  badge,
  title,
  subtitle,
}: {
  accent: string;
  badge: string;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 className="m-0 font-[family-name:var(--font-bodoni)] text-[clamp(30px,4.6vw,46px)] font-normal leading-[1.05] text-[color:var(--merch-cream)]">
          {title}
        </h2>
        <span
          className="whitespace-nowrap border px-[11px] py-[6px] text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ borderColor: accent, color: accent }}
        >
          {badge}
        </span>
      </div>
      <p className="mt-3.5 max-w-[64ch] text-[15px] leading-relaxed text-[color:var(--merch-muted)]">
        {subtitle}
      </p>
      <div className="my-[26px] h-px bg-[color:var(--merch-line)]" aria-hidden="true" />
    </div>
  );
}

function MerchGrid({
  items,
  emptyMessage,
  pageSize,
}: {
  items: readonly MerchItem[];
  emptyMessage: string;
  pageSize?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize ?? items.length);
  if (items.length === 0) return <MerchEmptyPanel message={emptyMessage} />;
  const visibleItems = items.slice(0, visibleCount);
  const remaining = items.length - visibleItems.length;
  return (
    <>
      <ul className="grid grid-cols-1 items-start gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, index) => (
          <MerchCard key={`${item.url}-${index}`} item={item} />
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + pageSize!)}
          className="mx-auto mt-8 block min-h-[44px] border px-7 text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--merch-muted)]"
          style={{ borderColor: 'var(--merch-line)' }}
        >
          Load {Math.min(pageSize!, remaining)} more
        </button>
      )}
    </>
  );
}

export function MerchSection() {
  const drops = newDrops([...MERCH_CATALOGUE.officialStore, ...MERCH_CATALOGUE.fanMade]);
  const anyAffiliate = hasAffiliateMerch([
    ...MERCH_CATALOGUE.officialStore,
    ...MERCH_CATALOGUE.fanMade,
    ...MERCH_CATALOGUE.shopTheLook,
  ]);

  return (
    <div className="merch-shell">
      <div className="mx-auto max-w-[1180px] px-4 pb-2 pt-8 sm:px-6 sm:pt-[52px]">
        <MerchMarquee
          eyebrow="Three racks · One page"
          title={
            <>
              The merch
              <br />
              <i style={{ color: 'var(--merch-gold)' }}>directory</i>
            </>
          }
          lede="Three lists: official drops from Taylor's store, fan-made pieces we've vetted, and the things she's actually been seen wearing."
        />
      </div>

      <div className="mt-14">
        <MerchSectionRail sections={RAIL_SECTIONS} />
      </div>

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
        {drops.length > 0 && (
          <section aria-labelledby="merch-new-drops" className="pt-[50px]">
            <MerchSectionHead
              accent="var(--merch-gold)"
              badge="New drops"
              title={<span id="merch-new-drops">Just landed</span>}
              subtitle="Recently verified listings from the official shop and our fan-made curation."
            />
            <MerchGrid items={drops.slice(0, 6)} emptyMessage="" />
          </section>
        )}
        <section id={SECTION_OFFICIAL} className="pt-[74px] pb-3">
          <MerchSectionHead
            accent="var(--merch-gold)"
            badge="Official"
            title={
              <>
                From <i style={{ color: 'var(--merch-gold)' }}>Taylor&apos;s</i> shop
              </>
            }
            subtitle="Pulled straight from the official store — when we have a vetted feed for it. We don't sell anything ourselves; every card here will link straight to taylorswift.com."
          />
          <MerchGrid
            items={MERCH_CATALOGUE.officialStore}
            emptyMessage="Nothing curated here yet — we don't have a vetted feed from the official store."
            pageSize={12}
          />
        </section>

        <section id={SECTION_FANMADE} className="pt-[74px] pb-3">
          <MerchSectionHead
            accent="var(--merch-rose)"
            badge="Fan made"
            title={
              <>
                Made by <i style={{ color: 'var(--merch-rose)' }}>Swifties</i>
              </>
            }
            subtitle="One maker per listing, hand-checked before it's added. Nothing's been vetted yet — this is where those listings will live."
          />
          <MerchGrid
            items={MERCH_CATALOGUE.fanMade}
            emptyMessage="We haven't vetted any fan-made shops yet — each one gets hand-checked before it's listed here."
          />
        </section>

        <section id={SECTION_STYLE} className="pt-[74px] pb-3">
          <MerchSectionHead
            accent="var(--merch-lilac)"
            badge="Get the look"
            title={
              <>
                Seen on <i style={{ color: 'var(--merch-lilac)' }}>Taylor</i>
              </>
            }
            subtitle="Everything our Fashion desk has identified, paired with where to buy it. When the original is gone or out of reach, we show the closest thing that isn't — and say so."
          />
          <MerchStyleSection />
        </section>

        {anyAffiliate && (
          <p className="mt-6 text-[11px] leading-relaxed text-[color:var(--merch-muted)] opacity-80">
            {SHOP_DISCLOSURE}
          </p>
        )}

        <div id={suggestLinkSectionId('merch')} className="pb-10">
          <SubmitLinkForm section="merch" />
        </div>
      </main>
    </div>
  );
}
