// Worker-side Supabase access — service role only. This is a completely
// different concern from packages/core (portable, public-anon-key, reader-
// side for web/mobile): the worker writes news_raw_item/news_story/etc,
// which have zero public RLS policies (supabase/migrations/
// 20260718120000_news_init.sql) — only service_role can touch them. Kept
// inside apps/worker, not packages/core, because it's not portable to a
// browser/app context and never should be.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createWorkerDbClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env or the news-worker GitHub Actions secrets).',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
