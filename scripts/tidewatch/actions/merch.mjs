import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { emitOfficialMerchEvent } from '../../merch-engine/emit-official-merch-event.mjs';

export const MERCH_QUEUE_PATHS = Object.freeze({
  outfit: path.join('.cache', 'tidewatch-merch-outfit.jsonl'),
  fan: path.join('.cache', 'tidewatch-merch-fan.jsonl'),
});
export const STORE_DROP_DRAFT_PATH = '.official-social-draft.json';

function parsedSourceRef(decision) {
  try {
    return JSON.parse(decision.watch_item?.source_ref ?? 'null');
  } catch {
    return null;
  }
}

export function outfitQueueEntry(decision) {
  const source = parsedSourceRef(decision);
  if (!source?.momentImageUrl || !source?.moment?.id) {
    throw new Error('merch_outfit requires source_ref JSON with moment.id and momentImageUrl');
  }
  const occurredAt = Date.parse(decision.decided_at);
  if (!Number.isFinite(occurredAt)) throw new Error('merch_outfit requires a valid decided_at');
  return {
    source: 'tidewatch',
    decisionId: decision.id,
    moment: source.moment,
    momentImageUrl: source.momentImageUrl,
    occurredAt,
  };
}

export function fanQueueEntry(decision) {
  const item = decision.watch_item ?? {};
  return {
    decisionId: decision.id,
    sourceRef: item.source_ref ?? null,
    title: item.title ?? null,
    excerpt: item.excerpt ?? null,
    decidedAt: decision.decided_at,
  };
}

async function appendQueue(file, entry) {
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await appendFile(file, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function readStoreDropDraft(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function runMerchAction(decision, {
  live = false,
  queuePaths = MERCH_QUEUE_PATHS,
  append = appendQueue,
  loadStoreDropDraft = readStoreDropDraft,
  emitOfficial = emitOfficialMerchEvent,
  db,
  now,
} = {}) {
  if (!live) return { acted: false, reason: 'router-not-live' };

  if (decision.class === 'merch_outfit') {
    await append(queuePaths.outfit, outfitQueueEntry(decision));
    return { acted: true, action: 'outfit_matcher_queue' };
  }
  if (decision.class === 'merch_fan') {
    await append(queuePaths.fan, fanQueueEntry(decision));
    return { acted: true, action: 'fan_merch_curation' };
  }
  if (decision.class === 'merch_official') {
    const draft = await loadStoreDropDraft(STORE_DROP_DRAFT_PATH);
    const event = await emitOfficial(draft, { db, now });
    return { acted: true, action: 'store_drop_draft', draftConfirmed: true, event };
  }
  throw new Error(`unsupported merch class: ${decision.class}`);
}
