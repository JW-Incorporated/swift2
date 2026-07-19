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

const FIELD_FAIL_CHARS = 2000;
const QUOTE_FAIL_CHARS = 600;

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
  // Future/planned whereabouts — the most stalker-useful thing a RUMOR can
  // carry ("reportedly staying at…"). Past-tense venue-level sightings are
  // fine; forward-looking location is a hard redline
  // (docs/content-ops/privacy-redlines.md, Never-OK #1). Zero hits on the
  // legitimate corpus at introduction (2026-07-19) — precision-safe.
  { label: 'future/planned whereabouts', re: /\b(?:will be|expected to (?:be|attend|arrive)|plans? to (?:be|stay)|reportedly staying|is staying) at\b/gi },
  { label: 'travel-pattern reference', re: /\b(?:travel pattern|usual route|regular route)s?\b/gi },
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
          suggestedFix: 'Replace with an original-words summary + a link; keep only a ≤300-char snippet if load-bearing.',
          confidence: 0.7,
        }));
      }
      if (text.length > FIELD_FAIL_CHARS) {
        findings.push(makeFinding({
          checker: id, severity: 'P1', title: `Oversized field (${text.length} chars) in "${it.title}"`,
          itemRef: at, excerpt: text.slice(0, 200) + '…',
          evidence: `Field is ${text.length} chars (> ${FIELD_FAIL_CHARS}) — reads as an article/body dump.`,
          suggestedFix: 'Trim to an original-words summary under the cap; link the source.', confidence: 0.85,
        }));
      }
      for (const span of quotedSpans(text)) {
        if (span.length >= QUOTE_FAIL_CHARS) {
          findings.push(makeFinding({
            checker: id, severity: 'P1', title: `Over-long verbatim quote (${span.length} chars) in "${it.title}"`,
            itemRef: at, excerpt: span.slice(0, 200) + '…',
            evidence: `Verbatim quoted span of ${span.length} chars (≥ ${QUOTE_FAIL_CHARS}) — statement/article dump.`,
            suggestedFix: 'Cut the quote to ≤300 chars or paraphrase in original words + link.', confidence: 0.85,
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
