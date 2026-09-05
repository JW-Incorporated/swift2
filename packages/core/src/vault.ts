// Vault data access (Tier 0 skeleton + Tier 1 moment detail) over Supabase.
// Portable: no view code, no framework — the web app and the future Expo app
// both call this. Callers pass their own Supabase URL + public key.
//
// DEPRECATED (OS-015, `docs/specs/2026-09-05-one-source-three-surfaces.md`
// §6 Phase 1, D1): `apps/mobile` no longer calls `createVaultClient` — it
// reads the published content bundle via `@swift2/content`'s `loadBundle`
// instead (see `apps/mobile/lib/vault.ts` + `vault-bundle-map.ts`). This
// module stays only as `apps/web/lib/vault.ts`'s live-Supabase path (used
// when `NEXT_PUBLIC_SUPABASE_*` env is configured) until OS-014 moves the
// web reader onto the bundle too, at which point `createVaultClient`, the
// `era`/`milestone`/`month_item` Supabase tables it reads (OS-016), and this
// whole file are slated for removal. Do not add new callers.
import { createClient } from '@supabase/supabase-js';
import type { Era, Milestone, Moment, MonthItem, TrackNote } from '@swift2/shared';
import { orderedEras } from '@swift2/shared';
import {
  mapEra,
  mapMilestone,
  mapMoment,
  mapMonthItem,
  mapTrackNote,
  type EraRow,
  type MilestoneRow,
  type MomentRow,
  type MonthItemRow,
  type TrackNoteRow,
} from './map';

export interface VaultClientConfig {
  supabaseUrl: string;
  /** The public (anon / publishable) key — Vault reads are RLS public. */
  supabaseKey: string;
}

/**
 * Tier 0: the always-resident skeleton. Small enough to load up front so
 * scrubbing never waits on the network (per the v1 spec's payload budget).
 */
export interface VaultSkeleton {
  eras: Era[];
  milestones: Milestone[];
  monthItems: MonthItem[];
}

export interface VaultDataSource {
  getSkeleton(): Promise<VaultSkeleton>;
  /** Tier 1: on-demand detail for one month item. Null if none authored. */
  getMoment(monthItemId: string): Promise<Moment | null>;
  /** On-demand per-album song track guide (non-month-scoped, off Tier 0). */
  getTrackGuide(eraSlug: string): Promise<TrackNote[]>;
}

// Tier 0 goes to every client on load, so select only the columns the mappers
// use: keep the wire payload equal to what the budget gate measures, and don't
// let a future editorial column silently bloat it (select('*') would).
const ERA_COLS = 'slug,title,album,start_date,end_date,sort_order,theme,cover_image_url';
const MILESTONE_COLS = 'id,era_slug,type,title,date';
const MONTH_ITEM_COLS = 'id,era_slug,year,month,category,title,snippet,source_url,thumbnail_url';

// Explicit Tier 0 row ceiling — makes the payload boundary loud rather than
// relying on PostgREST's implicit cap silently truncating the timeline. Well
// above the budget-implied item count; hitting it means switch to the windowed
// prefetch the roadmap contemplates (W6 fallback).
const TIER0_MAX_ROWS = 2000;

export function createVaultClient(config: VaultClientConfig): VaultDataSource {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    // Public, read-only Vault access — no login. Disabling the auth/session
    // machinery keeps `core` free of browser localStorage / RN AsyncStorage
    // expectations, so it stays cleanly portable across web and Expo.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async getSkeleton(): Promise<VaultSkeleton> {
      const [eraRes, msRes, miRes] = await Promise.all([
        supabase.from('era').select(ERA_COLS).order('sort_order', { ascending: true }).limit(TIER0_MAX_ROWS),
        supabase
          .from('milestone')
          .select(MILESTONE_COLS)
          .order('date', { ascending: true })
          .order('id', { ascending: true })
          .limit(TIER0_MAX_ROWS),
        supabase
          .from('month_item')
          .select(MONTH_ITEM_COLS)
          // year, month, then id as a stable tie-breaker so multiple items in
          // the same month don't reshuffle between fetches (curated ordering).
          .order('year', { ascending: true })
          .order('month', { ascending: true })
          .order('id', { ascending: true })
          .limit(TIER0_MAX_ROWS),
      ]);

      if (eraRes.error) throw new Error(`getSkeleton (era): ${eraRes.error.message}`);
      if (msRes.error) throw new Error(`getSkeleton (milestone): ${msRes.error.message}`);
      if (miRes.error) throw new Error(`getSkeleton (month_item): ${miRes.error.message}`);

      if ((miRes.data?.length ?? 0) >= TIER0_MAX_ROWS) {
        throw new Error(
          `getSkeleton: month_item hit the ${TIER0_MAX_ROWS}-row Tier 0 cap — timeline may be truncated; move to windowed prefetch.`,
        );
      }

      return {
        eras: orderedEras(((eraRes.data ?? []) as EraRow[]).map(mapEra)),
        milestones: ((msRes.data ?? []) as MilestoneRow[]).map(mapMilestone),
        monthItems: ((miRes.data ?? []) as MonthItemRow[]).map(mapMonthItem),
      };
    },

    async getMoment(monthItemId: string): Promise<Moment | null> {
      const { data, error } = await supabase
        .from('moment')
        .select('*')
        .eq('month_item_id', monthItemId)
        .maybeSingle();

      if (error) throw new Error(`getMoment: ${error.message}`);
      if (!data) return null;
      return mapMoment(data as MomentRow);
    },

    async getTrackGuide(eraSlug: string): Promise<TrackNote[]> {
      const { data, error } = await supabase
        .from('track_note')
        .select('*')
        .eq('era_slug', eraSlug)
        .order('track_number', { ascending: true, nullsFirst: false });

      if (error) throw new Error(`getTrackGuide: ${error.message}`);
      return ((data ?? []) as TrackNoteRow[]).map(mapTrackNote);
    },
  };
}
