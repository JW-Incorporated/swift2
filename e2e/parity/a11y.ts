import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Route, Side } from './helpers';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), 'a11y-baseline');
export const UPDATE = process.env.A11Y_UPDATE === '1';

export interface A11yFinding {
  id: string;
  impact: string;
  /** One entry per violating node: the axe target selector path, JSON-encoded. */
  targets: string[];
}
/** `<side>/<route>` -> serious + critical findings. One file per Playwright project. */
export type A11yBaseline = Record<string, A11yFinding[]>;

export const keyOf = (side: Side, route: Route): string => `${side}/${route.name}`;

/** axe (wcag2a + wcag2aa), serious and critical only, normalised and sorted. */
export async function scan(page: Page): Promise<A11yFinding[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: String(v.impact),
      targets: v.nodes.map((n) => JSON.stringify(n.target)).sort(),
    }))
    .sort((x, y) => x.id.localeCompare(y.id));
}

const file = (project: string) => resolve(dir, `${project}.json`);

export function readBaseline(project: string): A11yBaseline {
  if (!existsSync(file(project))) {
    throw new Error(`a11y: no baseline for ${project}; regenerate it (docs/one-ui/parity.md)`);
  }
  return JSON.parse(readFileSync(file(project), 'utf-8')) as A11yBaseline;
}

/** Callers run serially per project (a11y.spec.ts), so read-modify-write is safe. */
export function writeBaseline(project: string, key: string, findings: A11yFinding[]): void {
  mkdirSync(dir, { recursive: true });
  const current: A11yBaseline = existsSync(file(project)) ? JSON.parse(readFileSync(file(project), 'utf-8')) : {};
  current[key] = findings;
  const sorted = Object.fromEntries(Object.entries(current).sort(([x], [y]) => x.localeCompare(y)));
  writeFileSync(file(project), JSON.stringify(sorted, null, 2) + '\n');
}

/** Readable lines for every (rule, target) in `found` that `baseline` does not list. */
export function newViolations(found: A11yFinding[], baseline: A11yFinding[]): string[] {
  const known = new Set(baseline.flatMap((f) => f.targets.map((t) => `${f.id} ${t}`)));
  return found.flatMap((f) =>
    f.targets.filter((t) => !known.has(`${f.id} ${t}`)).map((t) => `[${f.impact}] ${f.id} at ${t}`),
  );
}

/** Rule ids present on side b but not on side a for one route (for the PM; never a failure). */
export function bOnly(a: A11yFinding[], b: A11yFinding[]): string[] {
  const onA = new Set(a.map((f) => f.id));
  return b.filter((f) => !onA.has(f.id)).map((f) => `${f.id} (${f.impact}, ${f.targets.length} node(s))`);
}
