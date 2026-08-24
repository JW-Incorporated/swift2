// Row -> domain mappers for the Current tier (proposal §3, PLAN.md Stage 2).
// Split from `map.ts` (which stays the Vault's mappers) to keep both files
// under the repo's 300-line guideline — same split as `packages/shared`'s
// `vault-types.ts` / `current-types.ts`. Kept separate from I/O so they can
// be unit-tested without a network. Nothing calls these yet (Stage 5/9 add
// the `packages/core/src/knowledge/` readers that will); they exist now so
// the row shapes are pinned against the migration the moment it lands.
import type {
  CurrentItem,
  CurrentItemCategory,
  CurrentItemStatus,
  EggLedgerEntry,
  FanSignal,
  KnowledgeDoc,
  KnowledgeDocTier,
  KnowledgeSource,
  LiveTheory,
  LiveTheoryOrigin,
  LocationLevel,
  SourceTier,
  SymbolLexiconEntry,
  Technique,
  TechniqueReliability,
} from '@swift2/shared';

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

function asKnowledgeSources(value: unknown): KnowledgeSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
    .map((s) => ({
      name: String(s['name'] ?? ''),
      url: String(s['url'] ?? ''),
      tier: (s['tier'] as SourceTier) ?? 'unverified',
    }))
    .filter((s) => s.url !== '');
}

export interface CurrentItemRow {
  id: string;
  story_id: string | null;
  observed_on: string;
  era_id: string;
  category: string;
  tags: unknown;
  headline: string;
  summary: string;
  detail: string;
  status: string;
  confidence: string;
  source_tier: string;
  sources: unknown;
  location_level: string | null;
  image_url: string | null;
  social_post: unknown;
  symbols: unknown;
  entities: unknown;
  heat: number;
  promoted_to: string | null;
  last_checked_on: string;
  expires_at: string;
  updated_at: string;
  redline_ok: boolean;
}

export function mapCurrentItem(row: CurrentItemRow): CurrentItem {
  const socialPost =
    row.social_post && typeof row.social_post === 'object' ? (row.social_post as Record<string, unknown>) : null;
  return {
    id: row.id,
    ...(row.story_id ? { storyId: row.story_id } : {}),
    observedOn: row.observed_on,
    eraId: row.era_id,
    category: row.category as CurrentItemCategory,
    tags: asStringArray(row.tags),
    headline: row.headline,
    summary: row.summary,
    detail: row.detail,
    status: row.status as CurrentItemStatus,
    confidence: row.confidence,
    sourceTier: row.source_tier as SourceTier,
    sources: asKnowledgeSources(row.sources),
    ...(row.location_level ? { locationLevel: row.location_level as LocationLevel } : {}),
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    ...(socialPost && typeof socialPost['shortcode'] === 'string'
      ? {
          socialPost: {
            platform: 'instagram' as const,
            shortcode: socialPost['shortcode'] as string,
            ...(typeof socialPost['postedOn'] === 'string' ? { postedOn: socialPost['postedOn'] as string } : {}),
          },
        }
      : {}),
    symbols: asStringArray(row.symbols),
    entities: asStringArray(row.entities),
    heat: row.heat,
    ...(row.promoted_to ? { promotedTo: row.promoted_to } : {}),
    lastCheckedOn: row.last_checked_on,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
    redlineOk: row.redline_ok,
  };
}

export interface FanSignalRow {
  id: string;
  window_start: string;
  window_end: string;
  platform: string;
  community: string;
  topic: string;
  summary: string;
  volume: number;
  heat: number;
  stance_mix: unknown;
  symbols: unknown;
  theory_ids: unknown;
  current_item_ids: unknown;
  sample_urls: unknown;
  expires_at: string;
  redline_ok: boolean;
}

export function mapFanSignal(row: FanSignalRow): FanSignal {
  return {
    id: row.id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    platform: row.platform,
    community: row.community,
    topic: row.topic,
    summary: row.summary,
    volume: row.volume,
    heat: row.heat,
    stanceMix: row.stance_mix && typeof row.stance_mix === 'object' ? (row.stance_mix as Record<string, unknown>) : {},
    symbols: asStringArray(row.symbols),
    theoryIds: asStringArray(row.theory_ids),
    currentItemIds: asStringArray(row.current_item_ids),
    sampleUrls: asStringArray(row.sample_urls),
    expiresAt: row.expires_at,
    redlineOk: row.redline_ok,
  };
}

export interface LiveTheoryRow {
  id: string;
  name: string;
  claim: string;
  first_seen_on: string;
  last_seen_on: string;
  origin: string;
  status: string;
  outcome: string;
  evidence_ids: unknown;
  symbols: unknown;
  heat: number;
  resolution: unknown;
  promoted_to: string | null;
  expires_at: string;
}

export function mapLiveTheory(row: LiveTheoryRow): LiveTheory {
  const resolution =
    row.resolution && typeof row.resolution === 'object' ? (row.resolution as Record<string, unknown>) : null;
  return {
    id: row.id,
    name: row.name,
    claim: row.claim,
    firstSeenOn: row.first_seen_on,
    lastSeenOn: row.last_seen_on,
    origin: row.origin as LiveTheoryOrigin,
    status: row.status,
    outcome: row.outcome,
    evidenceIds: asStringArray(row.evidence_ids),
    symbols: asStringArray(row.symbols),
    heat: row.heat,
    ...(resolution &&
    typeof resolution['on'] === 'string' &&
    typeof resolution['url'] === 'string' &&
    typeof resolution['outlet'] === 'string'
      ? {
          resolution: {
            on: resolution['on'] as string,
            url: resolution['url'] as string,
            outlet: resolution['outlet'] as string,
            ...(typeof resolution['note'] === 'string' ? { note: resolution['note'] as string } : {}),
          },
        }
      : {}),
    ...(row.promoted_to ? { promotedTo: row.promoted_to } : {}),
    expiresAt: row.expires_at,
  };
}

export interface EggLedgerRow {
  id: string;
  hint_doc_id: string | null;
  reveal_doc_id: string | null;
  hint_date: string;
  reveal_date: string | null;
  lag_days: number | null;
  mechanism: string;
  symbols: unknown;
  era_id: string | null;
  confirmed: boolean;
  outcome: string;
  summary: string;
  sources: unknown;
}

export function mapEggLedgerEntry(row: EggLedgerRow): EggLedgerEntry {
  return {
    id: row.id,
    ...(row.hint_doc_id ? { hintDocId: row.hint_doc_id } : {}),
    ...(row.reveal_doc_id ? { revealDocId: row.reveal_doc_id } : {}),
    hintDate: row.hint_date,
    ...(row.reveal_date ? { revealDate: row.reveal_date } : {}),
    ...(row.lag_days !== null ? { lagDays: row.lag_days } : {}),
    mechanism: row.mechanism,
    symbols: asStringArray(row.symbols),
    ...(row.era_id ? { eraId: row.era_id } : {}),
    confirmed: row.confirmed,
    outcome: row.outcome,
    summary: row.summary,
    sources: asKnowledgeSources(row.sources),
  };
}

export interface SymbolLexiconRow {
  key: string;
  label: string;
  aliases: unknown;
  category: string;
  linked_eras: unknown;
  note: string;
}

export function mapSymbolLexiconEntry(row: SymbolLexiconRow): SymbolLexiconEntry {
  return {
    key: row.key,
    label: row.label,
    aliases: asStringArray(row.aliases),
    category: row.category,
    linkedEras: asStringArray(row.linked_eras),
    note: row.note,
  };
}

export interface TechniqueRow {
  key: string;
  label: string;
  description: string;
  reliability: string;
  recurrence_test: string;
  example_ids: unknown;
  linked_symbols: unknown;
  sources: unknown;
}

export function mapTechnique(row: TechniqueRow): Technique {
  return {
    key: row.key,
    label: row.label,
    description: row.description,
    reliability: row.reliability as TechniqueReliability,
    recurrenceTest: row.recurrence_test,
    exampleIds: asStringArray(row.example_ids),
    linkedSymbols: asStringArray(row.linked_symbols),
    sources: asKnowledgeSources(row.sources),
  };
}

export interface KnowledgeDocRow {
  id: string;
  kind: string;
  tier: string;
  title: string;
  text: string;
  date: string | null;
  recency_date: string | null;
  open: boolean;
  status: string;
  source_tier: string;
  sources: unknown;
  era_id: string | null;
  symbols: unknown;
  entities: unknown;
  expires_at: string | null;
  redline_ok: boolean;
}

export function mapKnowledgeDoc(row: KnowledgeDocRow): KnowledgeDoc {
  return {
    id: row.id,
    kind: row.kind,
    tier: row.tier as KnowledgeDocTier,
    title: row.title,
    text: row.text,
    ...(row.date ? { date: row.date } : {}),
    ...(row.recency_date ? { recencyDate: row.recency_date } : {}),
    open: row.open,
    status: row.status,
    sourceTier: row.source_tier,
    sources: asKnowledgeSources(row.sources),
    ...(row.era_id ? { eraId: row.era_id } : {}),
    symbols: asStringArray(row.symbols),
    entities: asStringArray(row.entities),
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    redlineOk: row.redline_ok,
  };
}
