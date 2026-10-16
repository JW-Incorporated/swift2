#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { killEvents } from '../notifications-kill.mjs';

export const CORRECTIONS_LIVE_SWITCH = 'TIDEWATCH_CORRECTIONS_LIVE';
const CORRECTION_DELAY_MS = 5 * 60 * 1000;
const CORRECTION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function correctionKey(storyId) {
  return `correction:story:${storyId}`;
}

function parseArgs(argv) {
  const options = { storyId: null, mode: 'plan', confirm: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--story-id') options.storyId = argv[++index] ?? null;
    else if (arg === '--mode') options.mode = argv[++index] ?? null;
    else if (arg === '--confirm') options.confirm = argv[++index] ?? '';
    else throw new Error('usage: retract.mjs --story-id <id> [--mode plan|apply] [--confirm RETRACT-<id>]');
  }
  if (!options.storyId?.trim()) throw new Error('--story-id is required');
  if (!['plan', 'apply'].includes(options.mode)) throw new Error('--mode must be plan or apply');
  if (options.mode === 'apply' && options.confirm !== `RETRACT-${options.storyId}`) {
    throw new Error(`apply requires --confirm RETRACT-${options.storyId}`);
  }
  return options;
}

function pendingAt(events, now) {
  return events.filter((event) =>
    !event.killed_at && (!event.expires_at || new Date(event.expires_at).getTime() > now.getTime()));
}

function printPlan(plan, log) {
  log(`Retraction ${plan.mode}: story=${plan.storyId}`);
  for (const item of plan.currentItems) {
    log(`card: id=${item.id} headline=${JSON.stringify(item.headline)} action=debunk-and-hide`);
  }
  for (const event of plan.pendingEvents) {
    log(`pending-event: id=${event.id} title=${JSON.stringify(event.title)} action=kill`);
  }
  log(`prior-recipient-count: ${plan.recipientDeviceIds.length}`);
  for (const deviceId of plan.recipientDeviceIds) log(`prior-recipient: ${deviceId}`);
}

export function buildCorrectionEvent(storyId, recipientDeviceIds, now = new Date()) {
  return {
    category: 'correction',
    tier: 1,
    title: 'Correction',
    body: 'We retracted an earlier update because it was not accurate.',
    deep_link: '/',
    dedupe_key: correctionKey(storyId),
    target_device_ids: [...new Set(recipientDeviceIds)].sort(),
    available_at: new Date(now.getTime() + CORRECTION_DELAY_MS).toISOString(),
    expires_at: new Date(now.getTime() + CORRECTION_EXPIRY_MS).toISOString(),
  };
}

export async function runRetraction(options, {
  store,
  env = process.env,
  now = new Date(),
  log = console.log,
} = {}) {
  const inspection = await store.inspect(options.storyId, now);
  if (inspection.currentItems.length === 0) {
    throw new Error(`no current_item found for story ${options.storyId}`);
  }
  const plan = {
    mode: options.mode,
    storyId: options.storyId,
    currentItems: inspection.currentItems,
    pendingEvents: pendingAt(inspection.events, now),
    recipientDeviceIds: [...new Set(inspection.recipientDeviceIds)].sort(),
  };
  printPlan(plan, log);
  if (options.mode === 'plan') return { ...plan, mutated: false, correctionEnqueued: false };

  const visibleIds = inspection.currentItems
    .filter((item) => item.status !== 'debunked' || item.redline_ok !== false)
    .map((item) => item.id);
  if (visibleIds.length > 0) await store.hideCurrentItems(visibleIds);
  if (plan.pendingEvents.length > 0) await store.killPendingEvents(plan.pendingEvents, now);
  if (!inspection.retractionLogged) {
    await store.logRetraction({
      storyId: options.storyId,
      watchItemId: inspection.watchItemId,
      actionRef: `retraction:${options.storyId}`,
      now,
    });
  }

  const correctionsLive = env[CORRECTIONS_LIVE_SWITCH] === 'true';
  let correctionEnqueued = false;
  if (correctionsLive && plan.recipientDeviceIds.length > 0 && !inspection.correctionEnqueued) {
    await store.enqueueCorrection(
      buildCorrectionEvent(options.storyId, plan.recipientDeviceIds, now),
    );
    correctionEnqueued = true;
  } else if (!correctionsLive) {
    log(`${CORRECTIONS_LIVE_SWITCH} is off; correction enqueue skipped for ${plan.recipientDeviceIds.length} prior recipient(s).`);
  }
  return { ...plan, mutated: true, correctionEnqueued };
}

export function createRetractionStore(db) {
  return {
    async inspect(storyId) {
      const { data: currentItems, error: itemError } = await db.from('current_item')
        .select('id,headline,status,redline_ok').eq('story_id', storyId).is('merged_into', null);
      if (itemError) throw new Error(`load current_item: ${itemError.message}`);

      const eventById = new Map();
      for (const item of currentItems ?? []) {
        const { data, error } = await db.from('events')
          .select('id,dedupe_key,title,killed_at,expires_at')
          .like('dedupe_key', `%:current_item:${item.id}`);
        if (error) throw new Error(`load story events: ${error.message}`);
        for (const event of data ?? []) eventById.set(event.id, event);
      }
      const events = [...eventById.values()];
      let recipientDeviceIds = [];
      if (events.length > 0) {
        const { data, error } = await db.from('deliveries').select('device_id')
          .in('event_id', events.map((event) => event.id));
        if (error) throw new Error(`load prior recipients: ${error.message}`);
        recipientDeviceIds = (data ?? []).map((row) => row.device_id);
      }
      const actionRef = `retraction:${storyId}`;
      const [watchResult, decisionResult, correctionResult] = await Promise.all([
        db.from('watch_item').select('id').eq('story_id', storyId)
          .order('first_seen_at', { ascending: true }).limit(1).maybeSingle(),
        db.from('watch_decision').select('id').eq('action_ref', actionRef).limit(1).maybeSingle(),
        db.from('events').select('id').eq('dedupe_key', correctionKey(storyId)).maybeSingle(),
      ]);
      if (watchResult.error) throw new Error(`load watch_item: ${watchResult.error.message}`);
      if (decisionResult.error) throw new Error(`load retraction decision: ${decisionResult.error.message}`);
      if (correctionResult.error) throw new Error(`load correction event: ${correctionResult.error.message}`);
      return {
        currentItems: currentItems ?? [],
        events,
        recipientDeviceIds,
        watchItemId: watchResult.data?.id ?? null,
        retractionLogged: Boolean(decisionResult.data),
        correctionEnqueued: Boolean(correctionResult.data),
      };
    },
    async hideCurrentItems(ids) {
      const { error } = await db.from('current_item')
        .update({ status: 'debunked', redline_ok: false }).in('id', ids);
      if (error) throw new Error(`hide current_item: ${error.message}`);
    },
    async killPendingEvents(events, now) {
      await killEvents(db, events, now);
    },
    async logRetraction({ storyId, watchItemId, actionRef, now }) {
      const { error } = await db.from('watch_decision').insert({
        item_id: watchItemId,
        class: 'correction_debunk',
        confidence: 1,
        decider: 'retraction',
        answers: { story_id: storyId },
        action: 'retract',
        action_ref: actionRef,
        shadow: false,
        decided_at: now.toISOString(),
      });
      if (error) throw new Error(`log retraction: ${error.message}`);
    },
    async enqueueCorrection(event) {
      const { error } = await db.from('events').insert(event);
      if (error?.code !== '23505' && error) throw new Error(`enqueue correction: ${error.message}`);
    },
  };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const client = deps.store ? null : (deps.client ?? serviceClient());
  if (!deps.store && !client) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  return runRetraction(options, {
    store: deps.store ?? createRetractionStore(client),
    env: deps.env,
    now: deps.now,
    log: deps.log,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMain(main, { name: 'tidewatch-retract' });
}
