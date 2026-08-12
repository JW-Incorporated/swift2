// Red-line checker. Two outputs:
//   check()      — DETERMINISTIC, high-confidence policy violations → Findings
//                  (pasted lyrics, article/statement dumps, private-location
//                  data). These are real, so they're auto-filed.
//   candidates() — routes SAFETY candidates (over-sexualization, possible-illegal
//                  terms) to the safety-review agent. Deliberately NOT findings:
//                  a keyword hit ("child star", "revealing dress") must never
//                  auto-accuse — a human/agent classifies; only a CONFIRMED
//                  classification escalates. This avoids false accusations while
//                  guaranteeing nothing is missed.
import { makeFinding } from '../lib/finding.mjs';
import { CONFIG } from '../config.mjs';
// Caps come from ONE module (scripts/lib/content-caps.mjs). This file used to
// carry its own `const FIELD_FAIL_CHARS = 2000` and that is precisely how the
// 2026-08-11 incident happened: the moment.context cap was raised to 4000 by
// founder decision on 2026-07-22, three of the four cap sites moved, this one
// didn't, and every deliberately-long marquee context became a P1 safety
// ticket that a fixer then "fixed" by deleting the depth. Do not re-introduce
// a local number here.
import {
  dumpCapFor,
  dumpCapRationale,
  POLICY_CAPS,
  QUOTE_FAIL_CHARS,
} from '../../lib/content-caps.mjs';

function looksLikeLyricsBlock(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length >= 4 && lines.filter((l) => l.length > 0 && l.length < 60).length >= 4;
}
function quotedSpans(text) {
  const segs = text.split(/["“”]/);
  const spans = [];
  for (let i = 1; i < segs.length; i += 2) spans.push(segs[i]);
  return spans;
}
const PRIVATE_PATTERNS = [
  { label: 'street address', re: /\b\d{1,5}\s+[A-Z][a-z]+\s+(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Lane|Ln\.|Boulevard|Blvd\.|Drive|Dr\.)(?!\s+[A-Z])\b/g, ok: (m) => /^(19|20)\d{2}\s/.test(m) },
  { label: 'home address reference', re: /\bhome address\b/gi },
  { label: 'flight tracking', re: /\b(?:flight|jet) track(?:er|ing)\b/gi },
  { label: 'aircraft tail number', re: /\btail number\b/gi },
  { label: 'real-time location', re: /\b(?:is|was) (?:currently|right now) at\b/gi },
  { label: 'travel-pattern reference', re: /\b(?:travel pattern|usual route|regular route)s?\b/gi },
  // Interception-grade travel detail. Banned at every provenance and tense:
  // knowing the flight is how you stand where she lands. The *fact* of travel
  // at region level ("reportedly heading to the Caribbean") is fine and is
  // deliberately NOT matched here.
  { label: 'flight number', re: /\bflight\s*(?:no\.?|number|#)\s*[A-Z]{0,3}\s*\d{1,4}\b/gi },
  { label: 'private-aviation log', re: /\b(?:jet|aircraft|plane)\s+(?:log|movement)s?\b/gi },
  // NOTE — deliberately NOT deterministic (2026-07-20 rewrite, see
  // docs/content-ops/rumor-pipeline.md): forward-looking location used to be
  // caught here by a tense regex (`will be at`, `expected to attend`). That
  // was the wrong axis and it was both too strict and too loose. An announced
  // tour date is future, venue-specific, and completely fine because she
  // published it; "she was at <address> last night" is past tense and far
  // worse. What matters is specificity weighted by provenance, and no regex
  // can tell "will be in the Bahamas" (L0, fine) from "will be at the Bowery
  // Hotel" (L2 speculation, not fine) — that needs to read the place name.
  // So it routes to candidates() as `location-privacy` for the agent pass,
  // which has the matrix as its rubric. Deterministic patterns hard-fail CI,
  // so they stay narrow; judgment goes where judgment can be applied.
];

export const id = 'safety.redline';

export async function check(items) {
  const findings = [];
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts)) {
      const at = { type: it.type, file: it.file, era: it.era, key: it.key, field };
      if (looksLikeLyricsBlock(text)) {
        findings.push(makeFinding({
          checker: id, severity: 'P0', title: `Possible pasted lyrics in ${it.type} "${it.title}"`,
          itemRef: at, excerpt: text.slice(0, 300),
          evidence: 'Verse-like multi-line block — reads as stored lyrics (copyright red line).',
          suggestedFix: `Replace with an original-words summary + a link; keep only a ≤${POLICY_CAPS.sourceExcerpt}-char snippet if load-bearing.`,
          confidence: 0.7,
        }));
      }
      const fieldCap = dumpCapFor(it.type, field);
      if (text.length > fieldCap) {
        const why = dumpCapRationale(it.type, field);
        findings.push(makeFinding({
          checker: id, severity: 'P1', title: `Oversized field (${text.length} chars) in "${it.title}"`,
          itemRef: at, excerpt: text.slice(0, 200) + '…',
          evidence: `Field is ${text.length} chars (> ${fieldCap}) — reads as an article/body dump.`
            + (why ? ` Cap note: ${why}` : ''),
          suggestedFix: 'Trim to an original-words summary under the cap; link the source.', confidence: 0.85,
        }));
      }
      for (const span of quotedSpans(text)) {
        if (span.length >= QUOTE_FAIL_CHARS) {
          findings.push(makeFinding({
            checker: id, severity: 'P1', title: `Over-long verbatim quote (${span.length} chars) in "${it.title}"`,
            itemRef: at, excerpt: span.slice(0, 200) + '…',
            evidence: `Verbatim quoted span of ${span.length} chars (≥ ${QUOTE_FAIL_CHARS}) — statement/article dump.`,
            suggestedFix: `Cut the quote to ≤${POLICY_CAPS.sourceExcerpt} chars or paraphrase in original words + link.`, confidence: 0.85,
          }));
        }
      }
      for (const p of PRIVATE_PATTERNS) {
        for (const m of text.matchAll(p.re)) {
          if (p.ok && p.ok(m[0])) continue;
          findings.push(makeFinding({
            checker: id, severity: 'P0', title: `Private/location data in "${it.title}"`,
            itemRef: at, excerpt: m[0],
            evidence: `Matched private-data pattern (${p.label}). Sightings must stay past-tense, venue-level, never an address or real-time location.`,
            suggestedFix: 'Remove the address/real-time-location detail; keep only venue-level, historical framing.',
            confidence: 0.6,
          }));
        }
      }
    }
  }
  return findings;
}

/** Safety candidates for the agent pass — NOT findings. { item, field, kind, term, excerpt } */
export function candidates(items) {
  const out = [];
  const sx = CONFIG.safety.sexualizationTerms.map((t) => t.toLowerCase());
  const il = CONFIG.safety.illegalTerms.map((t) => t.toLowerCase());
  // Privacy-speculation screens (docs/content-ops/privacy-redlines.md).
  // Candidates by design: "diagnosis" also matches the disclosure Taylor made
  // herself (Always-OK), so an agent classifies each hit against the doc.
  const ps = (CONFIG.safety.privacySpeculationTerms ?? []).map((t) => t.toLowerCase());
  const lp = (CONFIG.safety.locationPrivacyTerms ?? []).map((t) => t.toLowerCase());
  for (const it of items) {
    for (const [field, text] of Object.entries(it.texts)) {
      const low = text.toLowerCase();
      const sHit = sx.find((t) => low.includes(t));
      const iHit = il.find((t) => low.includes(t));
      const pHit = ps.find((t) => low.includes(t));
      const lHit = lp.find((t) => low.includes(t));
      if (sHit) out.push({ item: it, field, kind: 'sexualization', term: sHit, excerpt: text.slice(0, 300) });
      if (iHit) out.push({ item: it, field, kind: 'illegal-context', term: iHit.trim(), excerpt: text.slice(0, 300) });
      if (pHit) out.push({ item: it, field, kind: 'privacy-speculation', term: pHit, excerpt: text.slice(0, 300) });
      if (lHit) out.push({ item: it, field, kind: 'location-privacy', term: lHit, excerpt: text.slice(0, 300) });
    }
  }
  return out;
}
