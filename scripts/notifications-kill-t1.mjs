#!/usr/bin/env node
// Notifications Phase 2 T1 safety — the kill/alert hook (NOTIFICATIONS_PLAN.md,
// this task's recorded founder decision on spec §12 Q2): T1 events
// (song_drop/album_news/tour_news) send fully automated with a 5-minute
// delay, and this script is the kill switch a founder uses to withdraw a
// pending false positive within that window.
//
// Usage:
//   node scripts/notifications-kill-t1.mjs --list                 # show pending T1 events
//   node scripts/notifications-kill-t1.mjs --kill <event-id>       # withdraw one before it sends
//
// "Log/flag the pending T1 send somewhere inspectable": --list is the
// inspectable surface (run it locally, or via a `gh workflow run` manual
// dispatch with SUPABASE creds) — every pending T1 event with its
// available_at (when it will fire) and a countdown. `--kill` sets
// `killed_at`, which the router (notification-router.ts) checks
// unconditionally before ever sending — a killed event is never delivered,
// even if `--kill` runs a moment before the 5-minute delay elapses.
import { pathToFileURL } from 'node:url';
import { serviceClient } from './lib/supabase.mjs';

const T1_CATEGORIES = ['song_drop', 'album_news', 'tour_news'];

function supabaseAdmin() {
  const db = serviceClient();
  if (!db) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — see SETUP_NOTIFICATIONS.md.',
    );
  }
  return db;
}

export async function listPendingT1(db, now = new Date()) {
  const { data, error } = await db
    .from('events')
    .select('id,category,title,body,available_at,created_at,killed_at')
    .in('category', T1_CATEGORIES)
    .is('killed_at', null)
    .gt('available_at', now.toISOString())
    .order('available_at', { ascending: true });
  if (error) throw new Error(`listPendingT1: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...row,
    secondsUntilSend: Math.max(
      0,
      Math.round((new Date(row.available_at).getTime() - now.getTime()) / 1000),
    ),
  }));
}

export async function killEvent(db, eventId, now = new Date()) {
  const { data, error } = await db
    .from('events')
    .update({ killed_at: now.toISOString() })
    .eq('id', eventId)
    .is('killed_at', null)
    .select('id,category,title,available_at')
    .maybeSingle();
  if (error) throw new Error(`killEvent: ${error.message}`);
  if (!data) {
    throw new Error(
      `no pending event with id ${eventId} (already sent, already killed, or does not exist)`,
    );
  }
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const db = supabaseAdmin();

  if (args.includes('--list')) {
    const pending = await listPendingT1(db);
    if (pending.length === 0) {
      console.log('No pending T1 events.');
      return;
    }
    console.log(`${pending.length} pending T1 event(s):`);
    for (const e of pending) {
      console.log(
        `  [${e.id}] ${e.category} — "${e.title}" — sends in ${e.secondsUntilSend}s (at ${e.available_at})`,
      );
    }
    return;
  }

  const killIdx = args.indexOf('--kill');
  if (killIdx >= 0) {
    const eventId = args[killIdx + 1];
    if (!eventId) throw new Error('usage: --kill <event-id>');
    const killed = await killEvent(db, eventId);
    console.log(`Killed pending event ${killed.id} (${killed.category} — "${killed.title}")`);
    return;
  }

  console.error('usage: notifications-kill-t1.mjs --list | --kill <event-id>');
  process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`notifications-kill-t1: ${error.message}`);
    process.exitCode = 1;
  });
}
