/**
 * Clownbot — the two prefill columns.
 * Both columns. Pure and deterministic: same corpus in => same board out.
 * ZERO model calls — this is what keeps the columns free (J2).
 *
 * Column 1 is derived from `theories.generated.ts` (unresolved theories, i.e.
 * `kind === 'theory' && outcome === 'pending'`) plus `clownbot-lore.ts` rumors
 * still open (`status === 'rumor' | 'reported'`). Column 2 contains only
 * planted-and-decoded easter eggs. Confirmed fan predictions, common readings,
 * and lore verdicts are a different category and never enter its count (#1998).
 *
 * `TheoryNote` (theories.generated.ts) carries no per-item date. The era's
 * `end` boundary is the best real signal the corpus offers for a sort key —
 * it is never invented, only read off the era record — and column 1 clamps
 * it to `now` so a still-open era never sorts as though it happened in the
 * future.
 */

import { LORE } from './clownbot-lore';
import { THEORIES_RAW } from './theories.generated';
import { ERAS, getEra } from './eras';

export type BoardItem = {
  id: string;
  /** Column 1 headline, or column 2 egg name. */
  title: string;
  /** One line of context. Never a claim of fact for an unresolved item. */
  blurb: string;
  /** What tapping it puts in the composer. Authored, not generated. */
  prompt: string;
  /** Sort key. ISO date. */
  date: string;
  /**
   * The era's DISPLAY NAME (`eras.ts`'s `name`), resolved by matching `date`
   * into each era's `[start, end]` window — never invented. `undefined` when
   * `date` falls outside every era's window; callers must omit that item
   * from era-grouped UI rather than inventing a bucket for it.
   */
  era?: string;
};

const MAX_CURRENT_THEORIES = 10;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolve a display-name era by matching `date` into an era's `[start, end]`
 * window. Never invents a bucket — `undefined` means no era claims this date. */
function resolveEraName(date: string): string | undefined {
  return ERAS.find((e) => date >= e.start && date <= e.end)?.name;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A short, human relative date for a `BoardItem`'s `date`, matching the
 * approved mockup's `when()` exactly: "today" (0–1 days), "N days ago"
 * (<7 days), "N weeks ago" (<42 days), else "Mon YYYY". Pure — same inputs,
 * same string, always. Dates are parsed at UTC midnight so the result never
 * drifts with the host machine's timezone.
 */
export function relativeDate(dateIso: string, now: Date): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  const days = Math.round((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 1) return 'today';
  if (days < 7) return `${days} days ago`;
  if (days < 42) return `${Math.round(days / 7)} weeks ago`;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Trim editorial prose to a single line of context. Never a model call. */
function firstLine(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(lastStop > 80 ? cut.slice(0, lastStop) : cut).trimEnd()}…`;
}

/** A plain question built from a title — never model-generated. */
function naturalPrompt(title: string): string {
  return `Make the case: what's actually going on with ${title}?`;
}

/** Vault theory notes have no per-item date; clamp the era's `end` to `now`. */
function vaultTheoryDate(eraId: string, now: Date): string {
  const end = getEra(eraId).end;
  const today = isoDate(now);
  return end < today ? end : today;
}

function byDateDesc(a: BoardItem, b: BoardItem): number {
  return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
}

/**
 * Column 1 — "top 10 current theories".
 * Unresolved theories + open rumors, recency-ranked, capped at 10.
 *
 * J2: derived from the corpus we already have. If the corpus yields fewer
 * than 10, RETURN FEWER. Do not pad, do not invent, do not reach further
 * back in time to fill the slot — a padded "current" list is a lie about
 * what is current. The UI handles a short list (§ Step 8).
 */
export function currentTheories(now: Date): BoardItem[] {
  const items: BoardItem[] = [];

  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      if (note.kind !== 'theory' || note.outcome !== 'pending') continue;
      const date = vaultTheoryDate(eraId, now);
      items.push({
        id: `theory:${eraId}:${note.slug}`,
        title: note.title,
        blurb: firstLine(note.claim),
        prompt: naturalPrompt(note.title),
        date,
        era: resolveEraName(date),
      });
    }
  }

  for (const item of LORE) {
    if (item.status !== 'rumor' && item.status !== 'reported') continue;
    items.push({
      id: `lore:${item.id}`,
      title: item.headline,
      blurb: firstLine(item.detail),
      prompt: item.prompts?.[0] ?? naturalPrompt(item.headline),
      date: item.date,
      era: resolveEraName(item.date),
    });
  }

  items.sort(byDateDesc);
  return items.slice(0, MAX_CURRENT_THEORIES);
}

export interface ConfirmedEggsOptions {
  /** Cap the number of items returned, newest first. Omitted = unlimited. */
  limit?: number;
}

/**
 * Column 2 — "past confirmed easter eggs".
 * Exactly theories.generated.ts entries with `kind === 'easter_egg'` and
 * `outcome === 'confirmed'`. The old all-confirmed default was the padding
 * bug in #1998: it made decoded eggs and common readings look like successful
 * fandom predictions. This narrower function cannot recreate that tally.
 *
 * Sort key: same as column 1 — newest first, by the vault entry's era `end`,
 * with a title tiebreak. `limit` slices AFTER that sort, so a capped list
 * is always the most recent confirmations, never an arbitrary slice.
 */
export function confirmedEggs(opts: ConfirmedEggsOptions = {}): BoardItem[] {
  const { limit } = opts;
  const items: BoardItem[] = [];

  for (const [eraId, notes] of Object.entries(THEORIES_RAW)) {
    for (const note of notes ?? []) {
      if (note.outcome !== 'confirmed' || note.kind !== 'easter_egg') continue;
      const date = getEra(eraId).end;
      items.push({
        id: `theory:${eraId}:${note.slug}`,
        title: note.title,
        blurb: firstLine(note.evidence ?? note.claim),
        prompt: naturalPrompt(note.title),
        date,
        era: resolveEraName(date),
      });
    }
  }

  items.sort(byDateDesc);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}
