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
// commits (#3486, #3542) followed by hand.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUG_TO_ERA_ID, slugify } from '../lib/longlive-sync-shared.mjs';

/**
 * Scans `text` for balanced top-level object literals (`{ ... }`) inside one
 * `[ ... ]` array, starting at `arrayStart` (the index of the array's own
 * `[`). Returns `{ end, objects }` where `end` is the index just past the
 * array's closing `]`, and `objects` is `[{ start, end }]` for each
 * comma-separated element at depth 1 inside the array. Tracks string/comment
 * state so a brace inside a quoted string, template literal, or `//`/`/* *‍/`
 * comment is never mistaken for real nesting — good enough for this
 * codebase's plain-object seed literals (no JSX, no dynamic braces in prose).
 */
export function scanArray(text, arrayStart) {
  let i = arrayStart + 1; // past the opening '['
  let depth = 1; // 1 == inside the outer array, nothing else open yet
  const objects = [];
  let objectStart = null;
  let inString = null; // "'" | '"' | '`' | null
  let inLineComment = false;
  let inBlockComment = false;

  while (i < text.length && depth > 0) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      i += 1;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (inString) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === inString) inString = null;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      inString = c;
      i += 1;
      continue;
    }
    if (c === '[' || c === '{') {
      // A '{' seen while sitting at depth 1 (nothing else open inside the
      // array yet) starts a new top-level object element.
      if (c === '{' && depth === 1 && objectStart === null) objectStart = i;
      depth += 1;
      i += 1;
      continue;
    }
    if (c === ']' || c === '}') {
      depth -= 1;
      // Closing back down to depth 1 while inside a tracked object means
      // THIS brace closed that object (its own matching '}').
      if (depth === 1 && objectStart !== null) {
        objects.push({ start: objectStart, end: i + 1 });
        objectStart = null;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  return { end: i, objects };
}

/**
 * Strips `//` line comments and `/* *‍/` block comments from `text`,
 * preserving string contents untouched (a comment marker inside a quoted
 * string is not a real comment). Used before URL-matching a candidate
 * object's text so a URL that only appears in a stale comment is never
 * mistaken for the object's real `url:` field.
 */
function stripComments(text) {
  let out = '';
  let i = 0;
  let inString = null;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (inString) {
      out += c;
      if (c === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (c === inString) inString = null;
      i += 1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      inString = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/**
 * Extracts the quoted string value of the FIRST `fieldName: '...'` (or
 * `"..."`) occurrence in `text`, comment-aware (a field name inside a
 * comment is skipped) and quote-escape-aware. Returns null if not found.
 */
function extractStringField(text, fieldName) {
  const codeOnly = stripComments(text);
  const marker = `${fieldName}:`;
  const at = codeOnly.indexOf(marker);
  if (at === -1) return null;
  let i = at + marker.length;
  while (codeOnly[i] === ' ' || codeOnly[i] === '\n' || codeOnly[i] === '\t') i += 1;
  const quote = codeOnly[i];
  if (quote !== "'" && quote !== '"') return null;
  i += 1;
  let value = '';
  while (i < codeOnly.length && codeOnly[i] !== quote) {
    if (codeOnly[i] === '\\') {
      value += codeOnly[i + 1] ?? '';
      i += 2;
      continue;
    }
    value += codeOnly[i];
    i += 1;
  }
  return value;
}

/**
 * Splits an E3 `productId` (`${momentId}:${index}:${url}`, built by
 * `recordsFromContent()` in audit-matches.mjs) back into its parts.
 * `momentId` never contains a colon (it's a `vault-<eraId>-<slug>` id or a
 * curated slug); `index` is digits only; only the trailing `url` piece may
 * itself contain colons (from its own `://`). Returns null if the shape
 * doesn't match — callers fail closed (unresolved) rather than guessing.
 */
export function parseProductId(productId) {
  const match = /^([^:]+):(\d+):(.+)$/.exec(String(productId ?? ''));
  if (!match) return null;
  return { momentId: match[1], index: Number(match[2]), url: match[3] };
}

/**
 * Finds the `{ start, end }` span of the single item object in `source`
 * whose computed id equals `momentId` — the SAME id scheme
 * scripts/sync-longlive-content.mjs's `contentItemFrom()` builds
 * (`vault-<eraId>-<slugify(title)>`, with a `-2`, `-3`, ... suffix on a
 * duplicate title within the same file, mirroring that script's per-era
 * `seenIds` dedup). Returns null when no item in this file matches — the
 * caller then knows to check the next seed file. Scoping a removal to the
 * actual moment (rather than any occurrence of the same product url
 * anywhere in the corpus) matters because a listing URL is NOT guaranteed
 * unique across moments (e.g. the same Etro dress worn twice) — see the
 * #3447 P2 review finding this function exists to close.
 */
export function findMomentSpan(source, momentId) {
  const itemsKeyIndex = source.indexOf('items: [');
  if (itemsKeyIndex === -1) return null;
  const arrayStart = itemsKeyIndex + 'items: ['.length - 1;
  const { objects } = scanArray(source, arrayStart);
  const eraSlug = extractStringField(source, 'eraSlug');
  const eraId = eraSlug ? (SLUG_TO_ERA_ID[eraSlug] ?? eraSlug) : null;
  const seenIds = new Set();
  for (const obj of objects) {
    const itemText = source.slice(obj.start, obj.end);
    const title = extractStringField(itemText, 'title');
    if (!title || !eraId) continue;
    const base = `vault-${eraId}-${slugify(title)}`;
    let candidate = base;
    let n = 2;
    while (seenIds.has(candidate)) candidate = `${base}-${n++}`;
    seenIds.add(candidate);
    if (candidate === momentId) return obj;
  }
  return null;
}

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

