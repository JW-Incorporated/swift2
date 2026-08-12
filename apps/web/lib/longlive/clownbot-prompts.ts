/**
 * Clownbot — the rotating suggested prompts.
 *
 * THE RULE (research finding #9): a prompt lands when it names a specific dated
 * artifact, invites a stance or a job (decode / rank / take a side / draft)
 * rather than a summary, is answerable from receipts the bot actually holds,
 * signals play, and EXPIRES. Draw from lore items tagged `rumor` or `reported`
 * inside the fresh window, plus two evergreens; retire any prompt whose item
 * has flipped to `debunked`.
 *
 * Every prompt string is authored on its lore item, so a prompt cannot outlive
 * or contradict its source: retirement is automatic because the pool is derived
 * from the file rather than maintained beside it.
 *
 * HONEST NOTE ON THE FRESH POOL: at time of writing no lore item sits inside
 * the 14-day window — the live slots must be filled by the refresh job
 * (docs/content-ops/clownbot-rumor-refresh.md), and we would not invent items
 * to fill them. So the fallback ladder below is the normal operating path
 * until the first refresh runs, and the surface says so out loud rather than
 * looking live when it is not.
 */

import {
  LORE,
  FRESH_WINDOW_DAYS,
  daysBetween,
  type LoreItem,
} from './clownbot-lore';

export interface SuggestedPrompt {
  /** Stable id: `<loreId>#<index>`. */
  id: string;
  text: string;
  /** The lore item backing it — retire the prompt if this flips to debunked. */
  sourceId: string;
  kind: 'live' | 'recent' | 'evergreen';
}

export const PROMPT_COUNT = 9;

/** Items older than this are no longer even "recent". */
const RECENT_WINDOW_DAYS = 400;

function promptsFrom(item: LoreItem, kind: SuggestedPrompt['kind']): SuggestedPrompt[] {
  return (item.prompts ?? []).map((text, i) => ({
    id: `${item.id}#${i}`,
    text,
    sourceId: item.id,
    kind,
  }));
}

/**
 * A prompt is retired when its item is debunked — a suggestion that invites a
 * reader to argue for a claim we know is dead is the credibility failure in
 * finding #8, arriving through the front door.
 *
 * The one exception is an item whose *ledger* records the debunking: the
 * Super Bowl autopsy prompt is ABOUT having been wrong, which is the product.
 * Those stay, and stay honest.
 */
function isRetired(item: LoreItem): boolean {
  return item.status === 'debunked' && !item.ledger;
}

/**
 * Build the pool, then rotate. `offset` moves the window so the chip set never
 * reads as a fixed menu (same trick as the Mood starters).
 */
export function suggestedPrompts(now: Date, offset = 0, count = PROMPT_COUNT): SuggestedPrompt[] {
  const usable = LORE.filter((item) => !isRetired(item) && (item.prompts?.length ?? 0) > 0);

  const live: SuggestedPrompt[] = [];
  const recent: SuggestedPrompt[] = [];
  const evergreen: SuggestedPrompt[] = [];

  for (const item of usable) {
    const age = daysBetween(item.date, now);
    const isLiveStatus = item.status === 'rumor' || item.status === 'reported';

    if (isLiveStatus && age <= FRESH_WINDOW_DAYS) {
      live.push(...promptsFrom(item, 'live'));
    } else if (age <= RECENT_WINDOW_DAYS) {
      recent.push(...promptsFrom(item, 'recent'));
    }
    if (item.evergreen) evergreen.push(...promptsFrom(item, 'evergreen'));
  }

  // Live first (the news cycle is the draw), then recent, then evergreens —
  // and always at least two evergreens so the surface is never thin.
  const seen = new Set<string>();
  const ordered: SuggestedPrompt[] = [];
  const push = (list: SuggestedPrompt[]) => {
    for (const p of list) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      ordered.push(p);
    }
  };
  push(live);
  push(evergreen.slice(0, 2));
  push(recent);
  push(evergreen);

  if (ordered.length === 0) return [];

  // Deterministic rotation over the ordered pool.
  const start = ((offset % ordered.length) + ordered.length) % ordered.length;
  const out: SuggestedPrompt[] = [];
  for (let i = 0; i < Math.min(count, ordered.length); i += 1) {
    out.push(ordered[(start + i) % ordered.length]);
  }
  return out;
}
