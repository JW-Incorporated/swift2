/**
 * Forward compatibility for installed apps (docs/decisions.md 2026-10-01,
 * "The mobile content loader is forward-compatible"). An app build's schemas
 * are frozen at build time, but the bundle keeps moving: a new era id or any
 * other new enum value would otherwise fail the whole file.
 *
 * `pruneUnknownEnumValues` repairs exactly one kind of failure — zod's
 * `invalid_value` (an enum/literal value this build doesn't know) — by
 * removing the smallest thing that contains it:
 *   1. the value itself, when it is an element of an array;
 *   2. else the nearest enclosing array element (e.g. the item carrying it);
 *   3. else the whole file (caller skips it).
 * It re-parses after each pass (max `MAX_PRUNE_PASSES`); any other issue code
 * is a real data problem and is returned as a failure for the caller to throw.
 */
import type { z } from 'zod';

export const MAX_PRUNE_PASSES = 5;

export type PruneResult =
  | { kind: 'ok'; data: unknown; removed: number }
  | { kind: 'drop-file'; reason: string }
  | { kind: 'invalid'; issues: z.ZodError['issues'] };

type Container = unknown[] | Record<string, unknown>;

/** The array + index to splice for one `invalid_value` issue, or null when no array encloses it. */
function removalTarget(
  root: unknown,
  path: PropertyKey[],
): { arr: unknown[]; index: number } | null {
  const chain: unknown[] = [root];
  let node: unknown = root;
  for (const key of path) {
    if (node === null || typeof node !== 'object') break;
    node = (node as Container)[key as never];
    chain.push(node);
  }
  // chain[i] is the value at path.slice(0, i). Walk from the deepest key up
  // to the nearest step that indexes into an array.
  for (let i = path.length - 1; i >= 0; i--) {
    const parent = chain[i];
    if (Array.isArray(parent) && typeof path[i] === 'number') {
      return { arr: parent, index: path[i] as number };
    }
  }
  return null;
}

/** Mutates `value` (pass freshly parsed JSON). */
export function pruneUnknownEnumValues(schema: z.ZodTypeAny, value: unknown): PruneResult {
  let removed = 0;
  for (let pass = 0; pass < MAX_PRUNE_PASSES; pass++) {
    const parsed = schema.safeParse(value);
    if (parsed.success) return { kind: 'ok', data: parsed.data, removed };

    const issues = parsed.error.issues;
    if (issues.some((issue) => issue.code !== 'invalid_value')) return { kind: 'invalid', issues };

    // Group by array so several removals from one array splice highest index
    // first and never shift each other.
    const byArray = new Map<unknown[], Set<number>>();
    for (const issue of issues) {
      const target = removalTarget(value, issue.path);
      if (!target) {
        return {
          kind: 'drop-file',
          reason: `unknown value at ${issue.path.join('.') || '<root>'}: ${issue.message}`,
        };
      }
      const set = byArray.get(target.arr) ?? new Set<number>();
      set.add(target.index);
      byArray.set(target.arr, set);
    }
    for (const [arr, indexes] of byArray) {
      for (const index of [...indexes].sort((a, b) => b - a)) {
        arr.splice(index, 1);
        removed++;
      }
    }
  }
  const last = schema.safeParse(value);
  if (last.success) return { kind: 'ok', data: last.data, removed };
  return { kind: 'invalid', issues: last.error.issues };
}
