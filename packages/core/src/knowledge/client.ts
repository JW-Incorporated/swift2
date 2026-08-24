// Current-tier reads (proposal §6, PLAN.md Stage 5) — read-only queries over
// the Current tier (`current_item` today; `live_theory`/`fan_signal` land
// with the surfaces that read them, Stage 7/9) for the current era. Mirrors
// `../vault.ts`'s client pattern exactly (anon key, RLS-public reads, no
// session machinery) so web and the future Expo app share it the same way.
import { createClient } from '@supabase/supabase-js';
import type { CurrentItem } from '@swift2/shared';
import { mapCurrentItem, type CurrentItemRow } from '../current-map';

export interface KnowledgeClientConfig {
  supabaseUrl: string;
  /** The public (anon / publishable) key — Current-tier reads are RLS
   * public, scoped to `redline_ok = true and not expired` at the policy
   * level (supabase/migrations/20260901000000_knowledge_engine.sql). */
  supabaseKey: string;
}

export interface KnowledgeDataSource {
  /**
   * Current-era `current_item` rows, newest-observed first. Rows already
   * promoted to a Vault moment (`promoted_to` set) are excluded here, not
   * left to the caller — once promoted, the Vault card is the one story
   * for that event, so a promoted row must never double up in the feed.
   */
  getCurrentItems(eraId: string): Promise<CurrentItem[]>;
}

const CURRENT_ITEM_COLS =
  'id,story_id,observed_on,era_id,category,tags,headline,summary,detail,status,confidence,source_tier,sources,location_level,image_url,social_post,symbols,entities,heat,promoted_to,last_checked_on,expires_at,redline_ok,updated_at';

// Defensive ceiling, same intent as vault.ts's TIER0_MAX_ROWS: makes the
// payload boundary loud rather than an implicit PostgREST truncation. A
// single era's live slice should never approach this in practice.
const CURRENT_ITEM_MAX_ROWS = 500;

export function createKnowledgeClient(config: KnowledgeClientConfig): KnowledgeDataSource {
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async getCurrentItems(eraId: string): Promise<CurrentItem[]> {
      const { data, error } = await supabase
        .from('current_item')
        .select(CURRENT_ITEM_COLS)
        .eq('era_id', eraId)
        .is('promoted_to', null)
        .order('observed_on', { ascending: false })
        .limit(CURRENT_ITEM_MAX_ROWS);

      if (error) throw new Error(`getCurrentItems: ${error.message}`);
      return ((data ?? []) as CurrentItemRow[]).map(mapCurrentItem);
    },
  };
}
