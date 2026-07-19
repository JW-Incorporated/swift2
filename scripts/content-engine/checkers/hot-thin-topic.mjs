// Hot-thin-topic checker (deterministic, NO NETWORK).
//
// Feeds the Rumor Desk's queue: topics that are HOT (recent + high-interest)
// but THIN on confirmed sourcing and carrying NO rumor treatment yet. These
// are the pages (the wedding is the canonical example) where trustworthy
// reporting is scarce, so the right move is a clearly-labeled, attributed
// "What's rumored" section — not a thin page and not unlabeled speculation.
//
// Why each gate exists (founder pushback 2026-07-19 — "are you sure Karen
// adequately flags these?"):
//   RECENT — visibility tier alone is static, so it would rank settled history
//     (the 2009 VMAs) alongside live topics. Settled events need no rumor
//     treatment; only recent, still-unfolding ones do.
//   HIGH-INTEREST — recency alone would queue every routine sighting.
//   THIN — topics with several reputable confirmed sources don't need rumor
//     coverage; the reporting exists.
//   UNTREATED — once an item carries rumor entries / a rumored confidence,
//     it leaves this queue (lifecycle upkeep is the Rumor Desk's other half).
//
// KNOWN LIMIT, by design: a checker only sees moments that exist. A brand-new
// rumor cycle with no vault moment yet is invisible here — that demand-side
// gap is owned by Lex Mode 2 (top-searched topics), not this checker.
import { makeFinding } from '../lib/finding.mjs';
import { tier } from '../lib/visibility.mjs';
// The generator's own normalizers (adopted from the retired content.rumor-gap
// checker, 2026-07-19): "has rumor treatment" must mean "has entries/labels
// the generator will actually SHIP" — a rumor entry the generator drops
// (unattributed, undated, whitespace claim) or a typo'd confidence value
// must not suppress a finding.
import { confidenceFrom, rumorsFrom } from '../../sync-longlive-content.mjs';

export const id = 'content.hot-thin-topic';

// Mirrors CONFIRMED_TIER in apps/web/lib/longlive/types.ts (a plain-node
// checker can't import the TS constant): below this tier the UI renders the
// rumor banner, which counts as treatment.
const CONFIRMED_TIER = new Set(['official', 'confirmed_interview']);

// A topic stays "live" (rumor-worthy) this long after its date. Beyond it,
// reporting has almost always either confirmed or died.
const RECENT_MONTHS = 15;
// Confirmed sourcing is "thin" below this many strong sources.
const MIN_STRONG_SOURCES = 2;
// A source counts as strong at this reliability_score (seeds' 1–5 scale).
const STRONG_AT = 4;

const RUMOR_CONFIDENCE = new Set(['rumored', 'speculation']);

// Rumor-prone categories: topics where information is genuinely withheld or
// private, so speculation fills the gap. Song analysis and chart records are
// high-interest but SETTLED-BY-NATURE — "rumors" make no sense there, and
// without this gate they dominated the queue (23 findings, mostly track
// write-ups, on the 2026-07-19 tuning run). 'business' is deliberately OUT:
// in this corpus business-category moments are certifications and chart
// records (settled facts), and emerging business rumors (tour announcements,
// deals) reach the Rumor Desk demand-side via Lex Mode 2, not a vault scan.
const RUMOR_PRONE = new Set(['relationship', 'sighting']);

const dateOf = (raw) =>
  raw?.date ?? (raw?.year ? `${raw.year}-${String(raw.month ?? 1).padStart(2, '0')}-${String(raw.day ?? 1).padStart(2, '0')}` : null);

export async function check(items, opts = {}) {
  const now = opts.now ?? Date.now(); // injectable so tests don't rot
  const cutoff = now - RECENT_MONTHS * 30.44 * 86_400_000;
  const findings = [];

  for (const it of items) {
    if (it.type !== 'moment') continue;

    // RECENT: still-unfolding, not settled history.
    const d = Date.parse(dateOf(it.raw) ?? '');
    if (Number.isNaN(d) || d < cutoff) continue;

    // HIGH-INTEREST: marquee visibility tier.
    if (tier(it) !== 'high') continue;
    // …AND rumor-prone: private-information territory, where speculation is
    // what fans actually seek. NO defining-significance bypass here — a
    // defining music item thin on sources is a DEPTH problem, and
    // content.depth-deficit already owns that queue (tuning run 2026-07-19:
    // the bypass pulled in "1989 goes Diamond"-style chart records, where
    // rumor treatment makes no sense).
    if (!RUMOR_PRONE.has(it.category)) continue;

    // THIN: few strong confirmed sources. reliability_score lives only in the
    // raw seed rows; corpus-level `sources` strips it. Unscored sources are
    // conservatively treated as weak.
    const strong = (it.raw?.moment?.sources ?? []).filter((s) => (s?.reliability_score ?? 0) >= STRONG_AT).length;
    if (strong >= MIN_STRONG_SOURCES) continue;

    // UNTREATED: no rumor treatment the generator would actually ship —
    // either shippable moment.rumors entries, or a sub-confirmed confidence
    // label (both placements, normalized exactly as the sync script does).
    const shippedRumors = rumorsFrom(it.raw?.moment?.rumors ?? it.raw?.rumors);
    const shippedConfidence = confidenceFrom(it.raw?.confidence ?? it.raw?.moment?.confidence);
    if (shippedRumors !== undefined) continue;
    if (shippedConfidence && !CONFIRMED_TIER.has(shippedConfidence)) continue;
    if (RUMOR_CONFIDENCE.has(it.raw?.confidence)) continue; // pre-schema fallback

    findings.push(
      makeFinding({
        checker: id,
        severity: 'P2',
        title: 'Hot topic with thin confirmed sourcing and no rumor treatment',
        itemRef: { type: 'moment', file: it.file, era: it.era, key: it.key, field: null },
        excerpt: it.title,
        evidence: `A recent, high-interest moment (${it.era}, dated ${dateOf(it.raw)}) has only ${strong} strong confirmed source(s) (reliability ≥ ${STRONG_AT}) and no labeled rumor coverage. Where trustworthy reporting is scarce, fans should get the attributed, dated rumors — clearly separated from confirmed fact — not a thin page.`,
        suggestedFix:
          'Route to the Rumor Desk: verify live speculation actually exists for this topic, then add clearly-labeled, attributed, dated rumor entries (and strengthen confirmed sourcing where reputable reporting exists). Never blend rumor into fact.',
        confidence: 0.65,
      }),
    );
  }
  return findings;
}
