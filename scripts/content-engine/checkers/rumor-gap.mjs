// Rumor-gap checker (deterministic, NO NETWORK).
//
// Founder directive 2026-07-19: hot topics with little trustworthy sourcing
// (the MSG wedding was the canonical example) must present clearly-labeled,
// attributed rumors instead of a thin page that either goes quiet or lets
// reported claims read as fact. The structural fix is the rumor tier:
// per-item `confidence` (sub-confirmed values render the loud banner) and
// `moment.rumors` (attributed, dated entries in the "What's rumored"
// section). This checker finds the pages that need that treatment and don't
// have it.
//
// Scope: HIGH-VISIBILITY moments (lib/visibility.mjs tier) in the
// LATEST-NEWS eras (CONFIG.visibility.latestNewsEras) — the topics fans are
// actively rumor-hunting right now. Historical catalog moments with one
// source are a *depth* problem (depth-deficit / photo-sparsity territory),
// not a rumor problem — flagging a 2008 EP page here would just be noise.
// For each in-scope moment, "almost no confirmed sourcing" means fewer than
// MIN_SOURCES cited sources; "no rumor treatment" means no `moment.rumors`
// entries AND no sub-confirmed `confidence` label. A page can clear the
// check three ways — add real confirmed sources, add labeled rumors, or
// mark the whole item sub-confirmed — all three are honest; a thin
// unlabeled hot page is not.
import { makeFinding } from '../lib/finding.mjs';
import { tier } from '../lib/visibility.mjs';
import { CONFIG } from '../config.mjs';

export const id = 'content.rumor-gap';

// Mirrors CONFIRMED_TIER in apps/web/lib/longlive/types.ts: at/above this a
// claim is established fact; below it the UI renders the rumor banner.
const CONFIRMED_TIER = new Set(['official', 'confirmed_interview']);

// Below this many cited sources a high-visibility page counts as thin.
const MIN_SOURCES = 2;

export async function check(items) {
  const findings = [];
  const latestNews = new Set(CONFIG.visibility.latestNewsEras);
  for (const it of items) {
    if (it.type !== 'moment') continue;
    if (!latestNews.has(it.era)) continue; // hot topics live in the latest-news eras
    if (tier(it) !== 'high') continue; // …and only the high-reach ones among them
    if (it.sources.length >= MIN_SOURCES) continue;

    const rumors = it.raw?.moment?.rumors;
    const hasRumorEntries = Array.isArray(rumors) && rumors.length > 0;
    const labeledSubConfirmed =
      typeof it.raw?.confidence === 'string' && !CONFIRMED_TIER.has(it.raw.confidence);
    if (hasRumorEntries || labeledSubConfirmed) continue;

    findings.push(
      makeFinding({
        checker: id,
        severity: 'P2',
        title: 'High-visibility topic is thin on sourcing with no rumor treatment',
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `A high-visibility moment (${it.era}) cites ${it.sources.length} source(s) — below the ${MIN_SOURCES}-source floor — and has neither \`moment.rumors\` entries nor a sub-confirmed \`confidence\` label. On a hot topic, thin unlabeled coverage either goes quiet or lets reported claims read as fact.`,
        suggestedFix:
          'Either add confirmed sources, or apply the rumor tier: set `confidence` below the confirmed tier (loud "Reported — not confirmed" banner) and/or add attributed, dated `moment.rumors` entries (each names the reporting outlet) so the page presents labeled rumors instead of staying thin. See docs/longlive-experience.md ("Mark a moment as rumored").',
        confidence: 0.7,
      }),
    );
  }
  return findings;
}
