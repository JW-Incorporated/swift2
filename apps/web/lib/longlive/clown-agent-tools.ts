/**
 * Clownbot agent loop (PLAN.md Stage 10, proposal §7) — the seven read-only
 * investigation tools.
 *
 * `knowledge_doc` (Stage 9's `packages/core/src/knowledge`) is THE knowledge
 * base now; `clown-index.ts` is the no-DB fallback only. Per PLAN.md Stage
 * 10's brief, that fallback applies ONLY when the DB is genuinely
 * unreachable (no env configured, or the call throws) — an empty-but-
 * reachable DB result is reported honestly as empty, never padded from the
 * compile-time corpus. Only `search` has a no-DB equivalent to fall back to
 * (`clown-retrieve.ts` over `clown-index.ts`); the other six tools degrade
 * to "no results" when the DB is unreachable — there is no compile-time
 * precedents/chatter/symbol-activity/track table to substitute, and
 * fabricating one would violate the same "never invent a source" rule that
 * governs everything else in this module family.
 *
 * `date_math` is the one tool that needs no DB at all (`packages/core`'s
 * `dateMath()` is pure).
 */
import { createKnowledgeClient, dateMath, type KnowledgeDataSource } from '@swift2/core';
import type { CurrentItem, EggLedgerEntry, FanSignal, KnowledgeDoc } from '@swift2/shared';

import { allClownDocs } from './clown-index';
import { docToRetrievedItem, type ItemSource, type ItemStatus, type RetrievedItem } from './clown-fallback';
import { hasRelevantTopic, retrieveClownDocs } from './clown-retrieve';

/** One tool call's result: the citable docs it surfaced (added to the
 * shared pool `record_take` may cite from) and a one-line human summary for
 * the investigation trail. */
export interface ToolCallResult {
  items: RetrievedItem[];
  summary: string;
}

/** Same env-detection shape as `lib/current.ts`'s `supabaseEnv()` — kept as
 * its own small copy rather than an import: `current.ts` doesn't export it,
 * and reaching into it to export a 4-line env lookup is not worth coupling
 * two otherwise-independent call sites for. */
function knowledgeEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/** Fresh client per call — mirrors `lib/current.ts`'s pattern (no
 * module-level caching), which keeps this trivially mockable in tests and
 * costs nothing: `createClient` does no network I/O on construction. */
function knowledgeClient(): KnowledgeDataSource | null {
  const env = knowledgeEnv();
  if (!env) return null;
  return createKnowledgeClient(env);
}

/** The DB's `status` column allows a fifth value (`'faded'`) that
 * `ItemStatus` doesn't carry. Degrades to the weakest honest label, same
 * rule `clown-index.ts`'s `mapRumorStatus` already uses — never rounded up. */
function toItemStatus(status: string): ItemStatus {
  switch (status) {
    case 'confirmed':
    case 'debunked':
    case 'reported':
    case 'rumor':
      return status;
    default:
      return 'rumor';
  }
}

function toItemSources(sources: readonly { name: string; url: string }[]): ItemSource[] {
  return sources.map((s) => ({ name: s.name, url: s.url }));
}

function knowledgeDocToItem(doc: KnowledgeDoc): RetrievedItem {
  return {
    id: doc.id,
    headline: doc.title,
    detail: doc.text,
    status: toItemStatus(doc.status),
    date: doc.date ?? doc.recencyDate ?? 'undated',
    sources: toItemSources(doc.sources),
  };
}

function currentItemToItem(item: CurrentItem): RetrievedItem {
  return {
    id: item.id,
    headline: item.headline,
    detail: item.detail,
    status: toItemStatus(item.status),
    date: item.observedOn,
    sources: toItemSources(item.sources),
  };
}

function eggLedgerEntryToItem(entry: EggLedgerEntry): RetrievedItem {
  const status: ItemStatus = entry.confirmed ? 'confirmed' : entry.outcome === 'debunked' ? 'debunked' : 'reported';
  return {
    id: entry.id,
    headline: `${entry.mechanism} — ${entry.summary.slice(0, 60)}`,
    detail: entry.summary,
    status,
    date: entry.revealDate ?? entry.hintDate,
    sources: toItemSources(entry.sources),
  };
}

/** Fan chatter is aggregate sentiment about the fandom, not a claim about
 * Taylor — there is no honest "confirmed" reading of it, so it always
 * degrades to `'rumor'`, the weakest label (never rounded up, same rule as
 * everywhere else in this file). */
function fanSignalToItem(signal: FanSignal): RetrievedItem {
  return {
    id: signal.id,
    headline: `${signal.platform} chatter: ${signal.topic}`,
    detail: signal.summary,
    status: 'rumor',
    date: signal.windowEnd.slice(0, 10),
    sources: signal.sampleUrls.map((url) => ({ name: signal.community, url })),
  };
}

function countLabel(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * `search` — DB-first FTS over `knowledge_doc`, falling back to the
 * compile-time corpus (`clown-retrieve.ts` over `clown-index.ts`) ONLY when
 * the DB is genuinely unreachable (no env, or the call throws) — matching
 * how `clown-retrieve.ts` itself is already the acknowledged no-DB path.
 * A DB result that comes back reachable-but-empty is reported as empty,
 * never padded from the compile-time corpus.
 */
export async function toolSearch(query: string, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (client) {
    try {
      const docs = await client.search(query, undefined, signal);
      const items = docs.map(knowledgeDocToItem);
      return { items, summary: `${countLabel(items.length, 'result')} for "${query}"` };
    } catch {
      // DB genuinely unreachable — fall through to the no-DB fallback below.
    }
  }
  const docs = retrieveClownDocs(query, allClownDocs());
  const items = docs.map(docToRetrievedItem);
  return { items, summary: `${countLabel(items.length, 'result')} for "${query}" (no-DB fallback)` };
}

export async function toolPrecedents(symbol: string, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (!client) return { items: [], summary: `precedents unavailable for "${symbol}" (no DB configured)` };
  try {
    const groups = await client.precedents(symbol, signal);
    const items = groups.flatMap((g) => g.entries.map(eggLedgerEntryToItem));
    if (groups.length === 0) return { items, summary: `no precedents found for "${symbol}"` };
    const mechanisms = groups.map((g) => g.mechanism).join(', ');
    return { items, summary: `${countLabel(items.length, 'precedent')} for "${symbol}" across mechanisms: ${mechanisms}` };
  } catch {
    return { items: [], summary: `precedents unavailable for "${symbol}" (DB unreachable)` };
  }
}

export async function toolRecent(days: number, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (!client) return { items: [], summary: `recent items unavailable (no DB configured)` };
  try {
    const rows = await client.recent(days, signal);
    const items = rows.map(currentItemToItem);
    return { items, summary: `${countLabel(items.length, 'item')} observed in the last ${days} day(s)` };
  } catch {
    return { items: [], summary: 'recent items unavailable (DB unreachable)' };
  }
}

export async function toolChatter(topic: string, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (!client) return { items: [], summary: `chatter unavailable for "${topic}" (no DB configured)` };
  try {
    const rows = await client.chatter(topic, signal);
    const items = rows.map(fanSignalToItem);
    return { items, summary: `${countLabel(items.length, 'chatter signal')} for "${topic}"` };
  } catch {
    return { items: [], summary: `chatter unavailable for "${topic}" (DB unreachable)` };
  }
}

/** `symbol_activity` rows are weekly counts, not citable claims — never
 * added to the citable pool, only summarised narratively for the model. */
export async function toolSymbolActivity(symbol: string, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (!client) return { items: [], summary: `symbol activity unavailable for "${symbol}" (no DB configured)` };
  try {
    const rows = await client.symbolActivity(symbol, signal);
    if (rows.length === 0) return { items: [], summary: `no recorded activity for "${symbol}"` };
    const weeks = rows
      .slice(0, 6)
      .map((r) => `${r.week}: ${r.n}`)
      .join(', ');
    return { items: [], summary: `weekly mentions of "${symbol}" — ${weeks}` };
  } catch {
    return { items: [], summary: `symbol activity unavailable for "${symbol}" (DB unreachable)` };
  }
}

export async function toolTrack(title: string, signal?: AbortSignal): Promise<ToolCallResult> {
  const client = knowledgeClient();
  if (!client) return { items: [], summary: `track lookup unavailable for "${title}" (no DB configured)` };
  try {
    const doc = await client.track(title, signal);
    if (!doc) return { items: [], summary: `no track found matching "${title}"` };
    return { items: [knowledgeDocToItem(doc)], summary: `found track "${doc.title}"` };
  } catch {
    return { items: [], summary: `track lookup unavailable for "${title}" (DB unreachable)` };
  }
}

/** Pure, no DB — always available regardless of env. */
export async function toolDateMath(phrase: string): Promise<ToolCallResult> {
  const resolved = dateMath().resolve(phrase);
  return {
    items: [],
    summary: resolved ? `"${phrase}" resolves to ${resolved}` : `could not resolve "${phrase}"`,
  };
}

/**
 * Route-level scope signal (PLAN.md Stage 10 req 3) — deliberately
 * NOT the `search` tool's own DB-unreachable fallback above. The proposal's
 * scope check is two independent clauses: "the first `search()` call
 * returns nothing... AND no symbol/entity resolves." The second clause is
 * checked here, separately, against the compile-time corpus's term-overlap
 * ranking (`clown-retrieve.ts`) regardless of whether the DB search already
 * ran — a sparsely-populated `knowledge_doc` (the canonical sync's coverage
 * is still growing) must never cause the route to redirect a reader away
 * from content that has always lived in the Vault/lore corpus. In scope
 * when EITHER surfaces anything; out of scope only when both come back
 * empty.
 *
 * Codex review MAJOR 6: a query merely containing recency language
 * ("today"/"currently"/"right now"/etc.) with NO real topic word must never
 * resolve scope on its own — `toolSearch`'s no-DB fallback and the
 * compile-time corpus below both go through `retrieveClownDocs`, whose
 * recency shortcut surfaces open items regardless of whether the rest of
 * the query means anything ("what should I cook today" would otherwise
 * resolve in-scope purely because SOME open theory exists). A result that
 * came from that shortcut (`toolSearch`'s own "(no-DB fallback)" summary
 * marker, or the `legacyDocs` check below, which is the same shortcut) must
 * additionally clear `hasRelevantTopic` — a genuine, recency-blind term
 * match — before it can resolve scope. A real, reachable DB hit needs no
 * such extra check: FTS relevance there is never the recency shortcut.
 */
export async function resolveScopeSignal(
  query: string,
  signal?: AbortSignal,
): Promise<{ inScope: boolean; result: ToolCallResult }> {
  const dbResult = await toolSearch(query, signal);
  if (dbResult.items.length > 0) {
    const usedNoDbFallback = dbResult.summary.includes('no-DB fallback');
    if (!usedNoDbFallback || hasRelevantTopic(query, allClownDocs())) {
      return { inScope: true, result: dbResult };
    }
  }

  if (hasRelevantTopic(query, allClownDocs())) {
    const legacyDocs = retrieveClownDocs(query, allClownDocs());
    if (legacyDocs.length > 0) {
      const items = legacyDocs.map(docToRetrievedItem);
      return {
        inScope: true,
        result: { items, summary: `${countLabel(items.length, 'result')} for "${query}"` },
      };
    }
  }

  return { inScope: false, result: dbResult };
}
