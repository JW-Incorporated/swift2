#!/usr/bin/env node
// Notification safety kill hook: every tier has a 5-minute delay, and this
// script lets an operator inspect or withdraw any pending false positive,
// including an event held while PUSH_FREEZE is on.
//
// Usage:
//   node scripts/notifications-kill.mjs --list                 # show pending events
//   node scripts/notifications-kill.mjs --kill <event-id>       # withdraw one before it sends
//
// --list is the inspectable surface (run it locally, or via a manual
// workflow dispatch with Supabase credentials): every pending event is shown
// with its available_at and created_at timestamps. `--kill` sets
// `killed_at`, which the router (notification-router.ts) checks
// unconditionally before ever sending — a killed event is never delivered,
// even if `--kill` runs a moment before the 5-minute delay elapses.
import { pathToFileURL } from 'node:url';
import { serviceClient } from './lib/supabase.mjs';
import { runMain } from './lib/cli.mjs';

function supabaseAdmin() {
  const db = serviceClient();
  if (!db) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — see SETUP_NOTIFICATIONS.md.',
    );
  }
  return db;
}

export async function listPendingEvents(db) {
  const { data, error } = await db
    .from('events')
    .select('id,category,tier,title,body,available_at,created_at,killed_at')
    .is('killed_at', null)
    .not('id', 'in', '(select event_id from deliveries where event_id is not null)')
    .order('available_at', { ascending: true });
  if (error) throw new Error(`listPendingEvents: ${error.message}`);
  return data ?? [];
}

export async function killEvent(db, eventId, now = new Date()) {
  const { data, error } = await db
    .from('events')
    .update({ killed_at: now.toISOString() })
    .eq('id', eventId)
    .is('killed_at', null)
    .not('id', 'in', '(select event_id from deliveries where event_id is not null)')
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
    const pending = await listPendingEvents(db);
    if (pending.length === 0) {
      console.log('No pending notification events.');
      return;
    }
    console.log(`${pending.length} pending notification event(s):`);
    for (const e of pending) {
      console.log(
        `  [${e.id}] tier ${e.tier} — "${e.title}" — available_at ${e.available_at} — created_at ${e.created_at}`,
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

  console.error('usage: notifications-kill.mjs --list | --kill <event-id>');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(main, { name: 'notifications-kill' });
}
