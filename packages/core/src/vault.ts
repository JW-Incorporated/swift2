// Vault data access (Tier 0 skeleton + Tier 1 moment detail) over Supabase.
// Portable: no view code, no framework — the web app and the future Expo app
// both call this. Callers pass their own Supabase URL + public key.
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

export function createVaultClient(config: VaultClientConfig): VaultDataSource {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  return {
    async getSkeleton(): Promise<VaultSkeleton> {
      const [eraRes, msRes, miRes] = await Promise.all([
        supabase.from('era').select('*').order('sort_order', { ascending: true }),
        supabase.from('milestone').select('*').order('date', { ascending: true }),
        supabase
          .from('month_item')
          .select('*')
          .order('year', { ascending: true })
          .order('month', { ascending: true }),
      ]);

      if (eraRes.error) throw new Error(`getSkeleton (era): ${eraRes.error.message}`);
      if (msRes.error) throw new Error(`getSkeleton (milestone): ${msRes.error.message}`);
      if (miRes.error) throw new Error(`getSkeleton (month_item): ${miRes.error.message}`);

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
