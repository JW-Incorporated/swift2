#!/usr/bin/env node
// E3 demotion applier (issue #3447, P2). The auditor never edits seed files
// itself (R1: judgment is a separate lane from landing) — this is the small,
// reviewable script that turns a `demotions` list (productId, url, auditor
// reasons) from an E3 authoring artifact into an actual removal from the
// affected moment's `products` array in `supabase/seed/content/**`, so a
// below-25 mismatch stops being visible on the site instead of only being
// recorded in a re-source ticket. Regenerating the built vault
// (`npm run sync:content`) and opening the PR remain separate steps —
// exactly the same divide `mend-links.mjs` (E1) draws between building a
// plan and a human/agent applying it, and the pattern the actual E3 apply
// commits (#3486, #3542) followed by hand. Source-scanning/parsing helpers
// live in demotion-source-scan.mjs (kept a separate module per this repo's
// 300-line file cap).
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findMomentSpan,
  parseProductId,
  scanArray,
  stripComments,
} from './demotion-source-scan.mjs';

export { findMomentSpan, parseProductId, scanArray };

/**
 * Removes the single product object literal whose `url:` value equals
 * `url` from any `products: [ ... ]` array in `source`, including its
 * trailing comma/whitespace so the array stays syntactically valid. Returns
 * `{ source, removed }` — `removed` is false (source unchanged) when the url
 * isn't found, so a caller can tell "not this file" from "nothing to do".
 * Only ever removes the FIRST match — a given retailer product-page URL is
 * authored once per moment by convention (never re-listed twice for the
 * SAME moment), and removing more than one match per call within a single
 * moment's scope would silently hide a duplicate-authoring bug instead of
 * surfacing it. Callers that need to disambiguate the SAME url appearing in
 * DIFFERENT moments must pre-scope `source` to one moment first — see
 * `findMomentSpan`.
 */
export function removeProductByUrl(source, url) {
  const marker = `products: [`;
  let searchFrom = 0;
  while (true) {
    const arrayKeyIndex = source.indexOf(marker, searchFrom);
    if (arrayKeyIndex === -1) return { source, removed: false };
    const arrayStart = arrayKeyIndex + marker.length - 1; // index of '['
    const { objects } = scanArray(source, arrayStart);
    for (const obj of objects) {
      // Match against the object's code with comments stripped, so a URL
      // that only survives in a stale `// url: ...` note is never confused
      // with the object's real, live `url:` field.
      const codeOnly = stripComments(source.slice(obj.start, obj.end));
      const matchesUrl = codeOnly.includes(`url: '${url}'`) || codeOnly.includes(`url: "${url}"`);
      if (!matchesUrl) continue;
      // Consume a following comma and any trailing same-line whitespace so
      // the array doesn't end up with a dangling blank line or comma.
      let end = obj.end;
      if (source[end] === ',') end += 1;
      while (source[end] === ' ') end += 1;
      if (source[end] === '\n') end += 1;
      const before = source.slice(0, obj.start);
      const after = source.slice(end);
      return { source: `${before}${after}`, removed: true };
    }
    searchFrom = arrayKeyIndex + marker.length;
  }
}

/**
 * Removes the product identified by `demotion.productId`'s url, but ONLY
 * from the moment `findMomentSpan` locates for that productId's momentId —
 * never a same-url product belonging to a different moment (#3447 P2 review
 * fix: this repo's own corpus already reuses a handful of listing urls
 * across unrelated moments, e.g. a custom Etro gown cross-listed on two
 * performance write-ups). Returns `{ source, removed }` like
 * `removeProductByUrl`; `removed` stays false when either the moment or the
 * url-within-that-moment can't be found.
 */
export function removeProductForMoment(source, demotion) {
  const parsed = parseProductId(demotion?.productId);
  if (!parsed) return { source, removed: false };
  const span = findMomentSpan(source, parsed.momentId);
  if (!span) return { source, removed: false };
  const before = source.slice(0, span.start);
  const momentText = source.slice(span.start, span.end);
  const after = source.slice(span.end);
  const { source: newMomentText, removed } = removeProductByUrl(momentText, demotion.url ?? parsed.url);
  if (!removed) return { source, removed: false };
  return { source: `${before}${newMomentText}${after}`, removed: true };
}

/**
 * Applies every demotion in `demotions` (from an E3 authoring artifact) to
 * the seed files under `seedDir`, scoping each removal to the specific
 * moment named in the demotion's `productId` (never a bare url-anywhere
 * match — see `removeProductForMoment`). A demotion that can't be resolved
 * (bad productId shape, moment not found, or url not found within that
 * moment) is reported unresolved rather than silently ignored — the
 * product may already have been removed by a prior run, or its url may
 * have changed since detection.
 */
export async function applyDemotions({ demotions, seedDir, readFileImpl = readFile, readdirImpl = readdir, writeFileImpl = writeFile }) {
  const applied = [];
  const unresolved = [];
  const files = (await readdirImpl(seedDir)).filter((name) => name.endsWith('.mjs'));
  const cache = new Map();
  for (const demotion of Array.isArray(demotions) ? demotions : []) {
    if (!demotion?.url) {
      unresolved.push({ productId: demotion?.productId ?? null, reason: 'no url on demotion' });
      continue;
    }
    if (!parseProductId(demotion.productId)) {
      unresolved.push({ productId: demotion?.productId ?? null, reason: 'productId does not match the moment:index:url shape' });
      continue;
    }
    let found = false;
    for (const file of files) {
      const path = join(seedDir, file);
      const current = cache.has(path) ? cache.get(path) : await readFileImpl(path, 'utf8');
      const { source, removed } = removeProductForMoment(current, demotion);
      if (!removed) continue;
      cache.set(path, source);
      applied.push({ productId: demotion.productId, url: demotion.url, file });
      found = true;
      break;
    }
    if (!found) {
      unresolved.push({ productId: demotion.productId, reason: 'moment or url not found in any seed file' });
    }
  }
  for (const [path, source] of cache) {
    await writeFileImpl(path, source, 'utf8');
  }
  return { applied, unresolved, filesChanged: [...cache.keys()] };
}

function argValue(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const artifactPath = argValue(args, '--artifact');
  const seedDir = argValue(args, '--seed-dir') ?? 'supabase/seed/content';
  if (!artifactPath) {
    throw new Error('usage: apply-demotions.mjs --artifact merch-audit-authoring.json [--seed-dir supabase/seed/content]');
  }
  const artifact = JSON.parse(await readFile(resolve(artifactPath), 'utf8'));
  const result = await applyDemotions({ demotions: artifact.demotions ?? [], seedDir: resolve(seedDir) });
  console.log(JSON.stringify({
    applied: result.applied.length,
    unresolved: result.unresolved.length,
    filesChanged: result.filesChanged.length,
  }));
  if (result.unresolved.length > 0) {
    console.error(`apply-demotions: ${result.unresolved.length} demotion(s) could not be located`, result.unresolved);
    // Fail loudly (P1 review finding, #3447 P2): an unresolved demotion is a
    // known mismatch that DID NOT get removed. Exiting zero here would let
    // the workflow silently regenerate the vault and open a PR (or open
    // none at all, if every demotion was unresolved) while a conclusively
    // judged mismatch stays visible — the opposite of this lane's whole
    // purpose. The caller (merch-audit-authoring.yml's apply-demotions job)
    // still commits and PRs whatever WAS resolved before this exit code is
    // observed, so a partial success is never thrown away; the nonzero
    // exit only ensures the run is flagged for follow-up.
    process.exitCode = 1;
  }
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`apply-demotions: ${error.message}`);
    process.exitCode = 1;
  });
}
