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
 * Removes the single product object literal whose `url:` value equals
 * `url` from any `products: [ ... ]` array in `source`, including its
 * trailing comma/whitespace so the array stays syntactically valid. Returns
 * `{ source, removed }` — `removed` is false (source unchanged) when the url
 * isn't found, so a caller can tell "not this file" from "nothing to do".
 * Only ever removes the FIRST match — a given retailer product-page URL is
 * authored once per moment by convention (never re-listed for a second
 * look), and removing more than one match per call would silently hide a
 * duplicate-authoring bug instead of surfacing it.
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
 * Applies every demotion in `demotions` (from an E3 authoring artifact) to
 * the seed files under `seedDir`, one url-match removal per demotion. A
 * demotion whose url isn't found in any seed file is reported unresolved
 * rather than silently ignored — the product may already have been removed
 * by a prior run, or its url may have changed since detection.
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
    let found = false;
    for (const file of files) {
      const path = join(seedDir, file);
      const current = cache.has(path) ? cache.get(path) : await readFileImpl(path, 'utf8');
      const { source, removed } = removeProductByUrl(current, demotion.url);
      if (!removed) continue;
      cache.set(path, source);
      applied.push({ productId: demotion.productId, url: demotion.url, file });
      found = true;
      break;
    }
    if (!found) {
      unresolved.push({ productId: demotion.productId, reason: 'url not found in any seed file' });
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
  }
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`apply-demotions: ${error.message}`);
    process.exitCode = 1;
  });
}
