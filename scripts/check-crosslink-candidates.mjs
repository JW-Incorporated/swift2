// Validates the `crosslink-candidate` queue against the built vault.
//
// Lex files one issue per page pair it judges worth linking; the Cross-Link
// builder drains that queue (docs/content-ops/depth-push.md). Between those two
// steps nothing checks that the ids are real — and a bad id fails SILENTLY:
// `resolveRelatedMoments()` drops unknown ids, so the "Keep reading" rail just
// renders short and nobody notices.
//
// This exists because the check is genuinely easy to get wrong by hand. On
// 2026-07-21 an ad-hoc grep reported 9 dangling refs across 8 candidates; every
// one was a false positive, because it compared references against the set of
// ids that are REFERENCED rather than the set that is DEFINED. The two look
// almost identical:
//
//     defined   ->  id: "vault-tloas-the-fate-of-ophelia-..."     (no prefix)
//     referenced->  "moment:vault-tloas-the-fate-of-ophelia-..."  (prefixed)
//
// Grepping the prefixed form finds only pages something already links to, so
// every genuinely-new link looks broken. Encoding it once removes the trap.
//
// Usage:  node scripts/check-crosslink-candidates.mjs
// Needs `gh` on PATH and read access to issues. Exits 1 if any ref is dangling.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runMain } from './lib/cli.mjs';

const VAULT = 'apps/web/lib/longlive/content-vault.generated.ts';

/** Ids as DEFINED by the vault — `id:` values, which carry no `moment:` prefix. */
export function definedIds(source) {
  const ids = new Set();
  for (const m of source.matchAll(/\bid:\s*["'](vault-[a-z0-9-]+)["']/g)) ids.add(m[1]);
  return ids;
}

/** Normalise a reference (`moment:vault-x` or bare `vault-x`) to its id. */
export function refToId(ref) {
  return String(ref).includes('moment:') ? String(ref).split('moment:')[1] : String(ref);
}

/** Pull the JSON body out of a candidate issue; returns null if unparseable. */
export function parseCandidate(body) {
  const m = String(body ?? '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export function validate(candidates, defined) {
  const problems = [];
  for (const { number, body } of candidates) {
    const parsed = parseCandidate(body);
    if (!parsed) {
      problems.push({ number, kind: 'unparseable', detail: 'no JSON object in body' });
      continue;
    }
    for (const field of ['from', 'to']) {
      const ref = parsed[field];
      if (!ref) {
        problems.push({ number, kind: 'missing-field', detail: field });
        continue;
      }
      if (!defined.has(refToId(ref))) {
        problems.push({ number, kind: 'dangling', detail: `${field}: ${ref}` });
      }
    }
    if (parsed.from && parsed.to && refToId(parsed.from) === refToId(parsed.to)) {
      problems.push({ number, kind: 'self-link', detail: refToId(parsed.from) });
    }
  }
  return problems;
}

// --- CLI ------------------------------------------------------------------
// Compare real file URLs, not strings. This checkout lives under "Vibe Coding"
// — a path with a space — which `import.meta.url` percent-encodes (`Vibe%20`)
// while `process.argv[1]` keeps literal. A naive endsWith() therefore never
// matches here and the CLI silently does nothing, which is exactly how this
// first shipped.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  runMain(main, { name: 'check-crosslink-candidates' });
}

function main() {
  const defined = definedIds(readFileSync(VAULT, 'utf8'));
  if (defined.size === 0) {
    console.error(`✖ found no ids in ${VAULT} — the id format changed; fix definedIds().`);
    return 1;
  }
  const raw = execSync(
    'gh issue list --label crosslink-candidate --state open --limit 500 --json number,body',
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const candidates = JSON.parse(raw);
  const problems = validate(candidates, defined);

  console.log(`crosslink-candidate queue: ${candidates.length} open, ${defined.size} vault ids`);
  if (!problems.length) {
    console.log('✓ every candidate resolves to a real page');
    return 0;
  }
  console.error(`\n✖ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`    #${p.number} ${p.kind}: ${p.detail}`);
  console.error(
    '\nA dangling id renders as a MISSING rail entry, not an error — resolveRelatedMoments()\n' +
      'drops unknown ids silently. Fix the id on the issue, or close it if the target page\n' +
      'does not exist yet.\n',
  );
  return 1;
}
