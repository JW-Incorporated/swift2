// Rumor Desk privacy redlines — the deterministic half, as one rule engine with
// two consumers.
//
// WHY THIS EXISTS
// ---------------
// The 2026-07-25 content auto-merge decision record named its own exposure and
// prescribed its own remedy:
//
//   "the mechanical checks do not cover judgment — notably Rumor Desk's privacy
//    redlines (security arrangements, health, minors), which are prose rules no
//    CI job can enforce. … If a redline violation ships, the fix is to add a
//    deterministic checker for it in scripts/content-engine/, not to restore a
//    human gate that was not being exercised in time to help."
//
// Rumor content now reaches longlivets.com with no human read. This module is
// that checker. It is imported by BOTH:
//
//   • scripts/validate-content.mjs        → blocking rules hard-fail CI (the
//                                           merge never happens)
//   • scripts/content-engine/checkers/rumor-redline.mjs
//                                         → every rule becomes a Karen finding
//                                           (catches whatever is already live)
//
// One source of truth, two bindings — the convention #1902 established for the
// auto-merge allowlist. A rule is never written down twice.
//
// THE DESIGN CONSTRAINT, AND WHAT THE CORPUS PROVED
// -------------------------------------------------
// A keyword hit must never auto-accuse. docs/content-ops/privacy-redlines.md is
// explicit about why: the corpus legitimately contains health material Taylor
// disclosed herself, so "diagnosis" is Always-OK and Never-OK depending on who
// said it. The existing design therefore routes term hits to classification
// (redlines.candidates → the safety agent), not to findings.
//
// That is not caution, it is measurement. Every naive term list was run against
// the real 36-rumor corpus before this module was written, and every one of them
// produced false positives:
//
//   "son"            → reason, season, Jason Kelce, Anderson, comparison  (13 hits)
//   "sued"           → "issued a copyright block"
//   "expecting"      → "fans kept expecting reputation (Taylor's Version)"
//   "house"          → "the house said" (Dior), "webstore warehouse", "steakhouse"
//   "security detail"→ "no address, no security detail"  ← the entry's own
//                       editorial note saying it is CLEAN, read as a violation
//
// The last one is the whole lesson in one line. So this module obeys a hard
// rule: **no finding is ever triggered by prose alone.** Every rule fires on
// STRUCTURE — a field value, a field's absence, or two fields disagreeing.
// Where prose is consulted at all (RR4) it only narrows a set that a structural
// provenance gate has already selected, it is word-boundary matched, and it is
// read from `claim` (what we assert) and never from `note` (our commentary
// about what we assert). That single field restriction is what makes the
// "no security detail" case a non-event rather than a false accusation.
//
// WHAT IS DELIBERATELY NOT HERE
// -----------------------------
// Residence precision ("her Watch Hill estate" vs. "the Ocean House resort").
// The redline matrix caps a residence at L1 regardless of provenance, which is
// the one cap no structural gate enforces — validate-content's
// locationSpecificity rule cannot tell a residence venue from a restaurant
// venue. A rule for it was written and rejected: separating "the Watch Hill
// estate" (her home, banned) from "the Ocean House resort" (a hotel, expressly
// blessed by the doc) requires knowing what the proper noun denotes, and every
// pattern that caught the first also caught the second. It is semantics, so it
// stays with the semantic layer (redlines.candidates → `location-privacy`).
// See the residual-risk section of docs/content-ops/privacy-redlines.md.
//
// RR5 (#1965) — `sourceTier` was, before this rule, self-declared with no
// check against reality: RR2 only catches 19 NAMED blind-item accounts
// overstating their tier, so any other source — an arbitrary blog, a
// look-alike domain (`reuters-daily.co`), a seeded wiki/forum page — could
// claim `established` or `official` and no rule fired. RR5 checks
// `established`/`official` against the real allowlist in
// scripts/lib/reputable-sources.mjs instead of trusting the claim, and RR4's
// `official` exemption below is now conditioned on the same domain check —
// an unverifiable `official` tier fails closed rather than disabling RR4.

/** Statuses that make a claim settled — a documented event, not speculation. */
import { isOfficialDomain, isEstablishedDomain, isEstablishedName } from './reputable-sources.mjs';

const RESOLVED = new Set(['confirmed', 'debunked']);

/**
 * Provenance that can carry an Always-OK exception on its own. Every Never-OK
 * carve-out in the doc ("a diagnosis Taylor disclosed in an interview", "what
 * Taylor or her team have published themselves") is an OFFICIAL-tier statement
 * or a resolved claim with a citation. Nothing else can be the exception, which
 * is precisely why RR4 can fire on a term without judging what the term means.
 */
const EXEMPT_TIER = 'official';

/**
 * Primary sources that are, by construction, blind items / self-published
 * gossip rather than reporting — the `social` tier's definition. Matched
 * against `reportedBy` ONLY, which is a short controlled attribution field, not
 * free prose. Matched against the PRIMARY source (the text before a "via" or a
 * parenthetical aggregator) so "Deuxmoi (via Cosmopolitan)" is judged as
 * Deuxmoi and "Us Weekly (via AOL)" is judged as Us Weekly.
 */
const BLIND_ITEM_SOURCES = [
  'deuxmoi',
  'naughty but nice',
  'rob shuter',
  'blind gossip',
  'crazy days and nights',
  'enty lawyer',
  'lipstick alley',
  'tattle life',
  'reddit',
  'r/swifties',
  'tiktok user',
  'twitter user',
  'x user',
  'instagram account',
  'fan account',
  'blind item',
];

/** Ordering of RumorSourceTier, weakest first — lets "above social" be a comparison. */
const TIER_RANK = { social: 0, tabloid: 1, established: 2, official: 3 };

/**
 * Redline CATEGORIES from privacy-redlines.md Never-OK #2/#3/#5/#7, plus the
 * two a 2026 audit found the policy under-specifies in practice (relationship
 * prognosis, body speculation).
 *
 * These are multi-word or unambiguous single tokens ONLY. Bare 'expecting',
 * 'son', 'child', 'sued', 'abuse' and friends were all tried and all produced
 * false positives on the live corpus; where a single word was irreplaceable it
 * was replaced by the phrase that actually carries the meaning ('expecting a
 * baby', not 'expecting'). Every entry is word-boundary matched.
 */
const REDLINE_CATEGORIES = {
  // Never-OK #2 — security arrangements. Absolute, untouched by the 2026-07-20
  // location relaxation: this is the category that produced a LIVE miss once
  // already ("Security tightened around her Watch Hill estate").
  'security-arrangements': [
    'security detail', 'security team', 'security tightened', 'extra security',
    'security presence', 'security protocol', 'security route', 'security arrangements',
    'panic room', 'safe room', 'alarm system', 'safe house', 'security sweep',
    'bodyguard', 'bodyguards', 'restraining order', 'stalker',
  ],
  // Never-OK #3 — body and health speculation.
  'health-body': [
    'pregnant', 'pregnancy', 'baby bump', 'expecting a baby', 'expecting a child',
    'miscarriage', 'fertility treatment', 'ivf', 'egg freezing',
    'diagnosed with', 'medical diagnosis', 'health scare', 'hospitalized',
    'hospitalised', 'mental health struggle', 'mental breakdown', 'nervous breakdown',
    'in rehab', 'eating disorder', 'anorexia', 'bulimia', 'ozempic',
    'plastic surgery', 'cosmetic surgery', 'botox', 'weight gain', 'weight loss',
    'overdose', 'substance abuse',
  ],
  // Never-OK #5 — minors. Mirrors CONFIG.safety.illegalTerms in intent but
  // narrowed to forms that cannot match a common word ('child' alone matches
  // "Childless Cat Lady"; 'minor' alone matches "a minor chart change").
  minors: [
    'underage', 'her son', 'her daughter', 'his son', 'his daughter',
    'their son', 'their daughter', 'the couple\'s son', 'the couple\'s daughter',
    'stepchild', 'stepchildren', 'a minor child', 'schoolchildren',
  ],
  // Under-specified in the policy but named by the 2026 audit — a prognosis is
  // speculation about a private relationship's future, distinct from reported
  // fact about its public state.
  'relationship-prognosis': [
    'heading for divorce', 'filing for divorce', 'divorcing', 'splitting up',
    'breaking up', 'on the rocks', 'trouble in paradise', 'marital tension',
    'marriage trouble', 'rocky patch', 'cheating on', 'cheated on',
    'having an affair', 'unfaithful', 'secretly separated', 'prenup dispute',
  ],
  // Never-OK #4 — sexuality speculation about her or anyone in her orbit.
  sexuality: ['gaylor', 'closeted', 'secretly gay', 'secretly bisexual', 'is actually queer'],
  // Never-OK #7 — legal accusations not in court records or major-outlet
  // reporting. The tier gate does the "major-outlet" half; these terms do the
  // "accusation" half.
  accusation: [
    'accused of', 'accusations of', 'allegations of', 'allegedly assaulted',
    'allegedly abused', 'sexual assault', 'sexual misconduct', 'domestic violence',
    'under criminal investigation', 'indicted', 'criminal charges',
  ],
};

/** Word-boundary matcher for a fixed phrase. Whitespace in the phrase matches any run of whitespace. */
function phraseRe(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}
const COMPILED = Object.fromEntries(
  Object.entries(REDLINE_CATEGORIES).map(([cat, terms]) => [cat, terms.map((t) => ({ t, re: phraseRe(t) }))]),
);

/** The primary source in a `reportedBy` string: everything before a "via" or a parenthetical/comma aggregator. */
function primarySource(reportedBy) {
  return String(reportedBy ?? '')
    .split(/\s*[,(]\s*|\s+via\s+/i)[0]
    .toLowerCase()
    .trim();
}

/**
 * The "via X" carrier in a `reportedBy` string, if present — the outlet that
 * actually carried/published the piece, distinct from `primarySource()`.
 * Needed because some entries name a PERSON as the primary attribution
 * ("Roger Goodell (NFL commissioner), via TODAY") — the newsroom that can
 * earn a tier is the carrier, not the speaker.
 */
function viaSource(reportedBy) {
  const m = String(reportedBy ?? '').match(/\bvia\s+([^,()]+)/i);
  return m ? m[1].toLowerCase().replace(/[).]+$/, '').trim() : '';
}

/**
 * True when the cited url or the reportedBy attribution supports at least
 * `established` tier by real provenance (scripts/lib/reputable-sources.mjs)
 * — a name/domain on the allowlist, not the authoring agent's own say-so
 * (#1965).
 */
function domainSupportsEstablished(rumor) {
  if (isEstablishedDomain(rumor.url)) return true;
  return isEstablishedName(primarySource(rumor.reportedBy)) || isEstablishedName(viaSource(rumor.reportedBy));
}

/**
 * True when the cited url resolves to Taylor's own verified domain — the
 * only thing that can earn `official` tier (#1965 hardening fix #2: an
 * unverifiable `official` tier fails closed rather than being trusted).
 */
function domainSupportsOfficial(rumor) {
  return isOfficialDomain(rumor.url);
}

/**
 * Rule catalogue. `blocking` decides which binding a rule gets:
 *   blocking: true  → validate-content.mjs hard-fails CI (the merge never happens)
 *   blocking: false → Karen files a P0/P1 ticket (surfaced, judged by a person)
 *
 * A rule is blocking when its remedy is MECHANICAL and unambiguous (relabel a
 * field, add a field, drop an inadmissible claim). RR1 is deliberately not
 * blocking: its remedy is a content judgment (coarsen the claim, or argue the
 * Ocean House principle applies), and hard-failing a judgment call is how a
 * checker turns into the 257-finding noise machine that was rejected before.
 */
export const RUMOR_REDLINE_RULES = {
  RR1: {
    id: 'RR1',
    blocking: false,
    severity: 'P0',
    label: 'whereabouts rumor with no declared locationSpecificity',
  },
  RR2: { id: 'RR2', blocking: true, severity: 'P1', label: 'sourceTier laundering' },
  RR3: { id: 'RR3', blocking: true, severity: 'P1', label: 'sourceTier absent' },
  RR4: { id: 'RR4', blocking: true, severity: 'P0', label: 'redline category asserted at speculative provenance' },
  RR5: { id: 'RR5', blocking: true, severity: 'P1', label: 'sourceTier not backed by a reputable-source allowlist' },
  RR6: {
    id: 'RR6',
    blocking: true,
    severity: 'P0',
    label: 'redline category asserted in prose (context/snippet) with no official-tier citation',
  },
};

/**
 * Evaluate one rumor entry.
 *
 * @param {object} rumor  a raw seed `moment.rumors[i]`
 * @param {{category?: string}} ctx  the parent moment's fields
 * @returns {{rule:string, severity:string, blocking:boolean, title:string,
 *            excerpt:string, evidence:string, fix:string}[]}
 */
export function rumorRedlineViolations(rumor, ctx = {}) {
  const out = [];
  if (!rumor || typeof rumor !== 'object') return out;

  const claim = typeof rumor.claim === 'string' ? rumor.claim : '';
  const status = rumor.status;
  const tier = rumor.sourceTier;
  const resolved = RESOLVED.has(status);

  // ── RR1 — a whereabouts rumor that never declared where it puts her ───────
  //
  // validate-content.mjs already enforces the provenance/specificity matrix:
  // locationSpecificity above 'region' on an unresolved rumor is a hard error.
  // It is the strongest privacy layer in the repo — and it is OPT-IN. The field
  // is optional, so omitting it skips the gate entirely. 34 of the corpus's 36
  // rumors omit it.
  //
  // Firing on "the text contains a location" was tried and does not work: the
  // venue lexicon that caught "1587 Prime … steakhouse" also caught "the house
  // said it was not sure when" (Dior, the fashion house) and "the era's likely
  // home". So the trigger is the MOMENT'S OWN CATEGORY instead. A `sighting`
  // moment is definitionally about where she was; a rumor on one that declines
  // to declare its location level has bypassed the matrix by omission. No prose
  // is read at all.
  //
  // This does NOT assert a violation — it asserts that the adjudicator never
  // ran. The remedy is to declare the field and let validate-content judge it.
  if (ctx.category === 'sighting' && !resolved && rumor.locationSpecificity == null) {
    out.push({
      rule: 'RR1',
      severity: RUMOR_REDLINE_RULES.RR1.severity,
      blocking: false,
      title: 'Whereabouts rumor does not declare locationSpecificity',
      excerpt: claim.slice(0, 300),
      evidence:
        `An unresolved rumor (status "${status}") on a \`sighting\` moment — a moment that is by definition ` +
        'about where she was — carries no `locationSpecificity`. That field is optional, so omitting it skips ' +
        "validate-content's provenance/specificity gate entirely (privacy-redlines.md Never-OK #1: speculation " +
        'is capped at region level). The gate did not clear this claim; it never saw it.',
      fix:
        'Declare `locationSpecificity`. If the claim names a venue, note that validate-content will then ' +
        'hard-fail it while the claim is unresolved — which is the matrix working: coarsen the claim to ' +
        "region level, or resolve it with a citation. Do not declare 'region' on a claim that names a venue; " +
        'the declaration is load-bearing and nothing downstream can verify it against the prose.',
    });
  }

  // ── RR3 — sourceTier absent (checked before RR2/RR4, which depend on it) ──
  //
  // Fail closed. `sourceTier` is what decides whether an Always-OK exception can
  // apply, so an absent tier silently disables RR4's provenance gate — the same
  // opt-in hole RR1 exists to close, one field over. The generator already drops
  // an unrecognised tier to undefined, so a typo lands here too.
  if (tier == null) {
    out.push({
      rule: 'RR3',
      severity: RUMOR_REDLINE_RULES.RR3.severity,
      blocking: true,
      title: 'Rumor has no sourceTier',
      excerpt: claim.slice(0, 300),
      evidence:
        '`sourceTier` is absent (or was dropped by the generator as unrecognised). It is the field that ' +
        'separates a Reuters report from a blind item, and it is the gate the redline-category rule (RR4) ' +
        'tests before deciding whether an Always-OK exception can possibly apply. With no tier, that gate ' +
        'cannot run and the claim carries no provenance weight to the reader either.',
      fix: `Set sourceTier to one of: ${Object.keys(TIER_RANK).join(' | ')}.`,
    });
  }

  // ── RR2 — sourceTier laundering ──────────────────────────────────────────
  //
  // Pure field-vs-field: the named primary source is a blind-item account, and
  // the declared tier claims better than `social`. This is the move that walks a
  // redline claim past RR4's provenance gate — relabel the blind item as
  // reporting and the exception test flips. Nothing semantic is read.
  const primary = primarySource(rumor.reportedBy);
  const blind = BLIND_ITEM_SOURCES.find((s) => primary.includes(s));
  if (blind && tier != null && (TIER_RANK[tier] ?? 0) > TIER_RANK.social) {
    out.push({
      rule: 'RR2',
      severity: RUMOR_REDLINE_RULES.RR2.severity,
      blocking: true,
      title: `Blind-item source carried at "${tier}" tier`,
      excerpt: `reportedBy: ${rumor.reportedBy}`,
      evidence:
        `The primary source is "${primary}" (matched "${blind}") — a blind-item / self-published gossip ` +
        `account, which is the definition of the \`social\` tier — but sourceTier is "${tier}". The tier ` +
        'field is how loudly the claim is presented to a reader, and it is the provenance gate every ' +
        'redline-category rule tests. Overstating it launders a blind item into reporting.',
      fix: "Set sourceTier: 'social'. If the claim was independently confirmed by a named outlet, cite that outlet in `reportedBy` instead and tier it accordingly.",
    });
  }

  // ── RR5 — sourceTier not backed by a reputable-source allowlist ──────────
  //
  // RR2 catches a NAMED blind-item account overstating its tier — a 19-name
  // denylist. It does nothing for the much larger surface: any source not on
  // that list — an arbitrary blog, a look-alike domain (reuters-daily.co), a
  // seeded wiki/forum page — could claim `established` or `official` and RR2
  // never fired (#1965). This is the allowlist half: `established`/`official`
  // must be earned by a real domain or outlet name
  // (scripts/lib/reputable-sources.mjs), not asserted by the authoring agent.
  // `official` is domain-only — no press outlet earns it by reporting ON
  // Taylor, only a citation that resolves to her own channel does.
  if (tier === 'official' && !domainSupportsOfficial(rumor)) {
    out.push({
      rule: 'RR5',
      severity: RUMOR_REDLINE_RULES.RR5.severity,
      blocking: true,
      title: 'sourceTier "official" not backed by an official domain',
      excerpt: `url: ${rumor.url}`,
      evidence:
        'sourceTier is "official" but the cited url does not resolve to a verified official domain ' +
        '(scripts/lib/reputable-sources.mjs OFFICIAL_DOMAINS). No press outlet earns "official" by reporting ' +
        'ON Taylor — only a citation to her own channel does. An unverifiable official tier fails closed.',
      fix:
        "Cite a url on Taylor's own domain and keep sourceTier: 'official', or retier to 'established' (or " +
        'lower) to match the outlet that actually reported it.',
    });
  } else if (tier === 'established' && !domainSupportsEstablished(rumor)) {
    out.push({
      rule: 'RR5',
      severity: RUMOR_REDLINE_RULES.RR5.severity,
      blocking: true,
      title: 'sourceTier "established" not backed by an allowlisted domain or outlet',
      excerpt: `reportedBy: ${rumor.reportedBy}; url: ${rumor.url}`,
      evidence:
        'sourceTier is "established" but neither the cited url\'s host nor the reportedBy attribution matches ' +
        'the reputable-source allowlist (scripts/lib/reputable-sources.mjs). A tier is a claim about REAL ' +
        "provenance, not the authoring agent's read of the page — an allowlist miss caps the claim at 'tabloid'.",
      fix:
        "Set sourceTier: 'tabloid' (or 'social' if the primary source is a blind item), or cite a url/outlet " +
        'that is actually on the reputable-source allowlist.',
    });
  }

  // ── RR4 — redline category asserted at speculative provenance ────────────
  //
  // THE KEY RULE, and the one that needs its logic stated plainly, because it is
  // the only one that touches prose.
  //
  // A term alone proves nothing — "diagnosis" is Always-OK when Taylor disclosed
  // it and Never-OK when a tabloid guessed it. But look at what the Always-OK
  // exceptions actually REQUIRE: "what Taylor or her team have published
  // themselves", "a diagnosis Taylor disclosed in an interview", "family facts
  // the family itself made public". Every single one is an OFFICIAL-tier
  // statement or a resolved claim carrying the citation that settled it.
  //
  // So the structure decides, not the word. A redline-category term on a claim
  // that is BOTH unresolved AND not official-tier cannot be the exception, no
  // matter what it means — there is no reading of it that lands in Always-OK.
  // The term identifies the category; the provenance structure decides
  // admissibility. Neither half accuses on its own, which is exactly the
  // property the existing candidates() route was built to preserve.
  //
  // Note the tier gate is `!== official`, not `tabloid|social`: the doc is
  // explicit that "attribution does not launder a privacy violation" — a real
  // outlet reporting a live pregnancy rumor is still Never-OK #3. And note that
  // `debunked` passes: we can and should report that a pregnancy rumor was
  // knocked down; we cannot carry a live one.
  //
  // Read from `claim` only. `note` is our editorial commentary — it is where an
  // author writes "no address, no security detail" to explain why an entry is
  // clean, and reading it is how a checker ends up flagging an entry for saying
  // it is safe. The note still reaches the agent layer via redlines.candidates().
  //
  // officialVerified (#1965 hardening fix #2): the EXEMPT_TIER check used to
  // trust a declared `official` tier outright, which meant an authoring agent
  // (or an injection persuading one) could set sourceTier: 'official' and
  // disable this entire rule for a redline claim. It now also requires the
  // cited url to resolve to a verified official domain — an unverifiable
  // `official` tier fails closed and RR4 still runs.
  const officialVerified = tier === EXEMPT_TIER && domainSupportsOfficial(rumor);
  if (!resolved && !officialVerified && claim) {
    for (const [category, terms] of Object.entries(COMPILED)) {
      const hit = terms.find(({ re }) => re.test(claim));
      if (!hit) continue;
      out.push({
        rule: 'RR4',
        severity: RUMOR_REDLINE_RULES.RR4.severity,
        blocking: true,
        title: `Redline category "${category}" asserted in an unresolved ${tier ?? 'untiered'}-tier claim`,
        excerpt: claim.slice(0, 300),
        evidence:
          `The claim asserts ${category} material (matched "${hit.t}") with status "${status}" and sourceTier ` +
          `"${tier ?? 'none'}". privacy-redlines.md Never-OK covers this category absolutely, and every ` +
          'Always-OK exception to it requires official provenance (Taylor or her team publishing it) or a ' +
          'resolved claim carrying its citation. This entry has neither, so no reading of the words lands in ' +
          'Always-OK. Attribution does not launder a privacy violation — a real outlet reporting it is still ' +
          'Never-OK.',
        fix:
          'Do not publish this claim. If Taylor or her team stated it on the record, cite that statement and ' +
          "set sourceTier: 'official'. If it was reported and then knocked down, carry it as `debunked` with " +
          'the debunking citation in `resolution` — reporting that a rumor was false is admissible; carrying ' +
          'a live one is not.',
      });
    }
  }

  return out;
}

/** The blocking subset — what validate-content.mjs hard-fails on. */
export function blockingRumorRedlineViolations(rumor, ctx) {
  return rumorRedlineViolations(rumor, ctx).filter((v) => v.blocking);
}

// ── RR6 — redline category asserted in free-text prose ─────────────────────
//
// #1967. blockingRumorRedlineViolations above only ever sees `moment.rumors[]`
// — a structured entry with its own `status`/`sourceTier`, which is what lets
// RR4 test provenance claim-by-claim. `moment.context` and `snippet` are the
// Answerer's and Content Shift's PRIMARY output (narrative fact prose, not a
// rumor), and until this rule they had no redline gate at all: a claim
// smuggled into "fact" prose — by an authoring mistake or by an indirect
// prompt injection off a fetched page (#1966) — routed around the one field
// RR4 watches and auto-merged with nothing to catch it.
//
// Prose has no per-claim `sourceTier`/`status` for a checker to test, so this
// cannot reuse RR4's per-claim exemption logic. The fail-closed rule for
// narrative is therefore STRICTER, mirroring RR4's Always-OK exemption at the
// item level instead of the claim level: a redline-category term anywhere in
// the prose is blocking UNLESS the moment carries at least one citation that
// resolves to Taylor's own verified domain (the same bar RR4/RR5 use for
// `official` tier). No sourceTier self-declaration can satisfy this — prose
// has no such field — only a real official-domain URL can.

/**
 * True when at least one of the given citation URLs resolves to Taylor's own
 * verified domain (scripts/lib/reputable-sources.mjs OFFICIAL_DOMAINS). This
 * is the item-level analog of RR4/RR5's per-claim `domainSupportsOfficial`,
 * used by the prose scan below, which has no per-claim tier field to test.
 *
 * @param {(string|null|undefined)[]} urls
 */
export function hasOfficialCitation(urls) {
  return (urls ?? []).some((u) => isOfficialDomain(u));
}

/**
 * Evaluate one block of free-text prose (`moment.context` or `snippet`) for
 * redline-category terms.
 *
 * @param {string} text
 * @param {{hasOfficialSource?: boolean}} ctx
 * @returns {{rule:string, severity:string, blocking:boolean, title:string,
 *            excerpt:string, evidence:string, fix:string}[]}
 */
export function proseRedlineViolations(text, ctx = {}) {
  const out = [];
  if (typeof text !== 'string' || !text) return out;
  if (ctx.hasOfficialSource) return out;

  for (const [category, terms] of Object.entries(COMPILED)) {
    const hit = terms.find(({ re }) => re.test(text));
    if (!hit) continue;
    out.push({
      rule: 'RR6',
      severity: RUMOR_REDLINE_RULES.RR6.severity,
      blocking: true,
      title: `Redline category "${category}" asserted in prose with no official-tier citation`,
      excerpt: text.slice(0, 300),
      evidence:
        `The text asserts ${category} material (matched "${hit.t}") and this item carries no citation to an ` +
        'official domain (Taylor or her team\'s own channel). privacy-redlines.md Never-OK covers this category ' +
        'absolutely. Unlike a structured `rumors[]` entry, prose has no sourceTier/status field a checker can ' +
        'test claim-by-claim, so the rule here is fail-closed: any redline term in narrative is blocking unless ' +
        'official provenance backs the whole item.',
      fix:
        'Remove this claim from the prose, move it into `moment.rumors` as a properly tiered and sourced entry ' +
        'instead (RR4 will then judge it on its own provenance), or cite a source on an official domain if ' +
        'Taylor or her team stated it themselves.',
    });
  }

  return out;
}

/** The blocking subset — what validate-content.mjs hard-fails on. */
export function blockingProseRedlineViolations(text, ctx) {
  return proseRedlineViolations(text, ctx).filter((v) => v.blocking);
}

/**
 * Grandfather list for RR6 (#1967), same convention as UNSOURCED_LEGACY /
 * SINGLE_OUTLET_LEGACY in scripts/lib/sourcing-gate.mjs: a NEW gate cannot
 * retroactively hard-fail CI on records that predate it, so the corpus as it
 * stood the day RR6 shipped (2026-08-26) is listed here once, by
 * `${file}#${slug}` (scripts/lib/sourcing-gate.mjs momentKey), rather than
 * silencing the rule.
 *
 * Every one of these is a term-list false positive on inspection — a public
 * court case (Denver), Taylor's own documentary disclosure (Miss Americana),
 * a third party's relative (Phil Collins's daughter, the "Childless Cat
 * Lady" political controversy), or "bodyguards"/"her son" describing someone
 * other than Taylor — not an actual redline violation. RR6 has no way to
 * tell any of that apart from a real violation (that is exactly the
 * structural gap RR4 has and RR6, on unstructured prose, cannot replicate),
 * so validate-content.mjs WARNs on a listed key instead of hard-failing, and
 * still hard-fails a genuinely NEW hit. This list must only ever shrink —
 * fixing a false positive (rephrase, or cite an official source) deletes its
 * entry; adding one to make a build green defeats the point of RR6 and
 * reopens the exact hole #1967 closed.
 */
export const PROSE_REDLINE_LEGACY = new Set([
  '1989.mjs#the-denver-trial-ends-with-the-single-dollar-she-asked-for',
  'lover.mjs#miss-americana-premiere',
  'lover.mjs#the-full-call-leaks-and-she-was-telling-the-truth',
  'red.mjs#a-virgin-islands-getaway-spotted-at-dinner-at-cocomaya',
  'red.mjs#a-british-virgin-islands-trip-ends-the-relationship',
  'reputation.mjs#a-johanna-ortiz-tiered-dress-for-the-lover-music-video',
  'red.mjs#red-ronan-stand-up-to-cancer',
  'the-life-of-a-showgirl.mjs#phil-collins-white-horse-blown-away',
  'tortured-poets.mjs#harris-endorsement-cat-lady',
]);
