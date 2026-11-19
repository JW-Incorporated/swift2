import type { CurrentItem, CurrentItemFact, CurrentItemStatus, KnowledgeSource } from '@swift2/shared';
import { CURRENT_ITEM_STATUSES } from '@swift2/shared';

/**
 * Read-time guard for the `/vault/live/[eraId]` payload. The server sanitises
 * these rows, but the reader dereferences them on first paint, so one row that
 * slips the contract must cost that row (or a field), never the page. A row is
 * dropped only when it cannot be shown at all: no id, headline or date.
 * Everything else is defaulted. A status this build does not know (one a
 * later migration adds) keeps the row and reads as "reported, not confirmed",
 * so a new status can never make stories vanish silently.
 * Hand-written on purpose: no schema library on the client path.
 */
type Raw = Record<string, unknown>;

const UNKNOWN_STATUS: CurrentItemStatus = 'reported';

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

const optionalText = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

function sources(value: unknown): KnowledgeSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Raw => isRecord(s) && typeof s.url === 'string')
    .map((s) => ({ ...s, name: text(s.name), url: s.url as string }) as KnowledgeSource);
}

function normaliseItem(raw: unknown): CurrentItem | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.headline !== 'string' || !raw.headline.trim()) return null;
  if (typeof raw.observedOn !== 'string' || !raw.observedOn) return null;
  const status = (CURRENT_ITEM_STATUSES as readonly unknown[]).includes(raw.status) ? raw.status : UNKNOWN_STATUS;

  const embed = isRecord(raw.embed) && typeof raw.embed.videoId === 'string' ? raw.embed : undefined;
  const socialPost =
    isRecord(raw.socialPost) && typeof raw.socialPost.shortcode === 'string' ? raw.socialPost : undefined;
  const facts = Array.isArray(raw.facts)
    ? (raw.facts.filter(isRecord) as unknown as CurrentItemFact[])
    : undefined;

  return {
    ...raw,
    status,
    eraId: text(raw.eraId),
    summary: text(raw.summary),
    detail: text(raw.detail),
    confidence: text(raw.confidence),
    lastCheckedOn: text(raw.lastCheckedOn),
    expiresAt: text(raw.expiresAt),
    updatedAt: text(raw.updatedAt),
    tags: strings(raw.tags),
    symbols: strings(raw.symbols),
    entities: strings(raw.entities),
    sources: sources(raw.sources),
    heat: typeof raw.heat === 'number' && Number.isFinite(raw.heat) ? raw.heat : 0,
    redlineOk: raw.redlineOk === true,
    imageUrl: optionalText(raw.imageUrl),
    mergedInto: optionalText(raw.mergedInto),
    promotedTo: optionalText(raw.promotedTo),
    countdownTargetAt: optionalText(raw.countdownTargetAt),
    countdownResolvedAt: optionalText(raw.countdownResolvedAt),
    embed,
    socialPost,
    facts,
  } as unknown as CurrentItem;
}

export function normaliseCurrentItems(raw: unknown): CurrentItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CurrentItem[] = [];
  for (const entry of raw) {
    const item = normaliseItem(entry);
    if (item) items.push(item);
  }
  return items;
}

/** Keeps only object rows with a string id, defaulting each `arrayKeys` field to `[]` when it is not an array. */
export function objectRows<T>(raw: unknown, arrayKeys: readonly (keyof T & string)[] = []): T[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Raw => isRecord(row) && typeof row.id === 'string')
    .map((row) => {
      const fixed: Raw = { ...row };
      for (const key of arrayKeys) if (!Array.isArray(fixed[key])) fixed[key] = [];
      return fixed as unknown as T;
    });
}
