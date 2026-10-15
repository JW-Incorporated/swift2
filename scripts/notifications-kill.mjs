#!/usr/bin/env node
// Owner-operated notification kill switch. During PUSH_FREEZE, this lists or
// kills events at any tier that have not produced an instant delivery. Fun
// delivery rows (including countdowns) do not make an event ineligible.
//
// Usage:
//   node scripts/notifications-kill.mjs --list
//   node scripts/notifications-kill.mjs --kill <event-id> [--apply]
//   node scripts/notifications-kill.mjs --kill --all-pending [--apply]
//
// Kill commands are dry-runs unless --apply is present.
import { pathToFileURL } from 'node:url';
import { serviceClient } from './lib/supabase.mjs';
import { runMain } from './lib/cli.mjs';

const PAGE_SIZE = 1_000;
const KILL_BATCH_SIZE = 100;
const EVENT_COLUMNS = 'id,tier,title,available_at,created_at,killed_at';
const KILLED_EVENT_COLUMNS = 'id,tier,title,available_at,created_at';

function supabaseAdmin() {
  const db = serviceClient();
  if (!db) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — see SETUP_NOTIFICATIONS.md.',
    );
  }
  return db;
}

function assertPageSize(pageSize) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('pageSize must be a positive integer');
  }
}

async function deliveredEventIds(db, pageSize) {
  const delivered = new Set();
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .from('deliveries')
      .select('event_id')
      .eq('kind', 'instant')
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`listPendingEvents deliveries: ${error.message}`);
    const rows = data ?? [];
    for (const row of rows) {
      if (row.event_id) delivered.add(row.event_id);
    }
    if (rows.length < pageSize) return delivered;
  }
}

export async function listPendingEvents(db, { pageSize = PAGE_SIZE } = {}) {
  assertPageSize(pageSize);
  const delivered = await deliveredEventIds(db, pageSize);
  const pending = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .from('events')
      .select(EVENT_COLUMNS)
      .is('killed_at', null)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`listPendingEvents events: ${error.message}`);
    const rows = data ?? [];
    pending.push(...rows.filter((row) => !delivered.has(row.id)));
    if (rows.length < pageSize) return pending;
  }
}

export async function killEvents(db, events, now = new Date()) {
  const killed = [];
  for (let offset = 0; offset < events.length; offset += KILL_BATCH_SIZE) {
    const ids = events.slice(offset, offset + KILL_BATCH_SIZE).map((event) => event.id);
    const { data, error } = await db
      .from('events')
      .update({ killed_at: now.toISOString() })
      .in('id', ids)
      .is('killed_at', null)
      .select(KILLED_EVENT_COLUMNS);
    if (error) throw new Error(`killEvents: ${error.message}`);
    killed.push(...(data ?? []));
  }
  if (killed.length !== events.length) {
    throw new Error(`killEvents: killed ${killed.length} of ${events.length} selected events`);
  }
  return killed;
}

function parseArgs(args) {
  let action = null;
  let eventId = null;
  let apply = false;
  let explicitDryRun = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--list' || arg === '--all-pending') {
      if (action) throw new Error('choose exactly one of --list, --kill, or --all-pending');
      action = arg === '--list' ? 'list' : 'all';
    } else if (arg === '--kill') {
      if (action) throw new Error('choose exactly one of --list, --kill, or --all-pending');
      eventId = args[i + 1];
      if (eventId === '--all-pending') {
        action = 'all';
      } else {
        if (!eventId || eventId.startsWith('--')) throw new Error('usage: --kill <event-id|--all-pending>');
        action = 'one';
      }
      i += 1;
    } else if (arg === '--apply') {
      apply = true;
    } else if (arg === '--dry-run') {
      explicitDryRun = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!action) throw new Error('choose exactly one of --list, --kill, or --all-pending');
  if (apply && explicitDryRun) throw new Error('--apply and --dry-run cannot be combined');
  if (action === 'list' && apply) throw new Error('--apply is only valid with a kill command');
  return { action, eventId, apply };
}

function formatEvent(event) {
  return `id=${event.id} tier=${event.tier} title=${JSON.stringify(event.title)} available_at=${event.available_at} created_at=${event.created_at}`;
}

export async function runCli(db, args, { now = new Date(), log = console.log } = {}) {
  const options = parseArgs(args);
  const pending = await listPendingEvents(db);

  if (options.action === 'list') {
    log(`${pending.length} killable event(s):`);
    for (const event of pending) log(formatEvent(event));
    return pending;
  }

  const selected =
    options.action === 'one' ? pending.filter((event) => event.id === options.eventId) : pending;
  if (options.action === 'one' && selected.length === 0) {
    throw new Error(`no killable event with id ${options.eventId}`);
  }

  if (!options.apply) {
    log(`Dry run: would kill ${selected.length} event(s). Re-run with --apply.`);
    for (const event of selected) log(formatEvent(event));
    return selected;
  }

  await killEvents(db, selected, now);
  log(`Killed ${selected.length} event(s).`);
  for (const event of selected) log(formatEvent(event));
  return selected;
}

async function main() {
  const args = process.argv.slice(2);
  parseArgs(args);
  return runCli(supabaseAdmin(), args);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(main, { name: 'notifications-kill' });
}
