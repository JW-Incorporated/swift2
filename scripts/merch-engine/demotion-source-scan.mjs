// Text-level scanner/parser helpers for apply-demotions.mjs (issue #3447,
// P2). Split out to keep apply-demotions.mjs under this repo's 300-line
// file cap (CLAUDE.md § MECHANICS). No external state; pure functions only.
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
export function stripComments(text) {
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
export function extractStringField(text, fieldName) {
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
