import { readFile } from 'node:fs/promises';
import { emitOfficialMerchEvent } from '../../merch-engine/emit-official-merch-event.mjs';

export const STORE_DROP_DRAFT_PATH = '.official-social-draft.json';
const ACTION_BY_CLASS = Object.freeze({
  merch_outfit: 'outfit_matcher_queue',
  merch_fan: 'fan_merch_curation',
  merch_official: 'store_drop_draft',
});

async function readStoreDropDraft(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeActionRef(db, decisionId, actionRef) {
  if (!db) throw new Error('merch action requires a database client');
  const { data, error } = await db.from('watch_decision')
    .update({ action_ref: actionRef }).eq('id', decisionId).is('action_ref', null).select('id');
  if (error) throw error;
  return (data ?? []).length === 1;
}

export async function runMerchAction(decision, {
  live = false,
  loadStoreDropDraft = readStoreDropDraft,
  emitOfficial = emitOfficialMerchEvent,
  recordAction = writeActionRef,
  db,
  now,
} = {}) {
  if (!live) return { acted: false, reason: 'router-not-live' };

  const action = ACTION_BY_CLASS[decision.class];
  if (!action) throw new Error(`unsupported merch class: ${decision.class}`);
  let event;
  if (decision.class === 'merch_official') {
    const draft = await loadStoreDropDraft(STORE_DROP_DRAFT_PATH);
    event = await emitOfficial(draft, { db, now });
  }
  const recorded = await recordAction(db, decision.id, action);
  return {
    acted: recorded, action, deduped: !recorded,
    ...(decision.class === 'merch_official' ? { draftConfirmed: true, event } : {}),
  };
}
