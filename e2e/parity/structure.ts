import type { Page } from '@playwright/test';

export interface StructNode {
  role: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Landmarks, lists and headings under the shared root, DOM order, root-relative integer css px. */
export async function collectStructure(page: Page, root: string): Promise<StructNode[]> {
  return page.locator(root).first().evaluate((rootEl) => {
    const ROLES = ['main', 'navigation', 'banner', 'article', 'list', 'listitem', 'heading'];
    const IMPLICIT: Record<string, string> = {
      MAIN: 'main',
      NAV: 'navigation',
      HEADER: 'banner',
      ARTICLE: 'article',
      UL: 'list',
      OL: 'list',
      LI: 'listitem',
      H1: 'heading',
      H2: 'heading',
      H3: 'heading',
      H4: 'heading',
      H5: 'heading',
      H6: 'heading',
    };
    const origin = rootEl.getBoundingClientRect();
    const out: StructNode[] = [];
    for (const el of Array.from(rootEl.querySelectorAll('*'))) {
      const explicit = el.getAttribute('role');
      const role = explicit && ROLES.includes(explicit) ? explicit : IMPLICIT[el.tagName];
      if (!role || el.getClientRects().length === 0) continue;
      const r = el.getBoundingClientRect();
      out.push({
        role,
        text: ((el as HTMLElement).innerText ?? '').replace(/\s+/g, ' ').trim().normalize('NFC'),
        x: Math.round(r.x - origin.x),
        y: Math.round(r.y - origin.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
    return out;
  });
}

export const EDGE_TOLERANCE = 2;

/** Differences between two structures; empty means they agree. */
export function diffStructure(a: StructNode[], b: StructNode[]): string[] {
  const problems: string[] = [];
  const count = (nodes: StructNode[]) => {
    const n: Record<string, number> = {};
    for (const x of nodes) n[x.role] = (n[x.role] ?? 0) + 1;
    return JSON.stringify(Object.entries(n).sort());
  };
  if (a.length !== b.length || count(a) !== count(b)) {
    problems.push(`count: a=${count(a)} b=${count(b)}`);
    return problems;
  }
  for (let i = 0; i < a.length; i++) {
    const p = a[i]!;
    const q = b[i]!;
    if (p.role !== q.role) problems.push(`#${i} role ${p.role} != ${q.role}`);
    if (p.text !== q.text) {
      let at = 0;
      while (at < p.text.length && p.text[at] === q.text[at]) at++;
      problems.push();
    }
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      if (Math.abs(p[k] - q[k]) > EDGE_TOLERANCE) problems.push(`#${i} ${p.role} ${k} ${p[k]} vs ${q[k]}`);
    }
    if (problems.length >= 10) break;
  }
  return problems;
}
