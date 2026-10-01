// The derived facts every part of the status page agrees on: what still needs
// the owner, what is closing, what shipped and for whom, and the snapshot the
// change-ping compares. One function so the rendered page and the ping can never
// disagree about what "changed" means. Pure.
import { pendingCloses } from './status-closes.mjs';
import { classifyFans } from './status-fans.mjs';
import { parseHaEntries } from './status-ha.mjs';
import { nextUpSections } from './status-plan.mjs';
import { snapshotOf } from './status-ping.mjs';
import { noiseRuleFor, selectShipped, SHIPPED_WINDOW_DAYS } from './status-shipped.mjs';
import { planSummary } from './status-sections.mjs';

export function buildView(data, now) {
  const parsed = parseHaEntries(data.haMarkdown);
  // An item the owner already answered leaves Needs you the moment its close PR is open, not when it lands.
  const pending = pendingCloses(data.openPrs);
  const items = parsed.filter((i) => !pending.has(i.number));
  const closing = parsed.filter((i) => pending.has(i.number)).map((i) => ({ number: i.number, title: i.title, ...pending.get(i.number) }));
  const windowMerged = data.mergedPrs.filter((pr) => pr.mergedAt && now - Date.parse(pr.mergedAt) <= SHIPPED_WINDOW_DAYS * 86_400_000);
  const shipped = selectShipped(data.mergedPrs, now);
  const fans = classifyFans(shipped, data.prFiles || new Map());
  const fanNumbers = new Set([...fans.content, ...fans.site, ...fans.app].map((x) => x.pr.number));
  const inFlight = data.openPrs.filter((pr) => !pr.draft && !noiseRuleFor(pr));
  const plan = data.plan ? `${data.plan.number}|${data.plan.title}|${JSON.stringify(nextUpSections(data.plan.body))}|${planSummary(data.plan.body)}` : '';
  const snapshot = snapshotOf({
    waiting: items.map((i) => i.number),
    closing: closing.map((c) => c.number),
    shipped: shipped.map((p) => p.number),
    posts: (data.posted || []).map((p) => p.url || `${p.platform}@${p.postedAt}`),
    feedback: data.feedback?.numbers || [],
    plan,
    strategy: (data.strategy?.bullets || []).join('\n'),
    note: data.note?.text || '',
    recap: data.recap || '',
  });
  return {
    items, closing, shipped, fans, inFlight, snapshot,
    behind: shipped.filter((pr) => !fanNumbers.has(pr.number)),
    filtered: windowMerged.length - shipped.length,
  };
}
