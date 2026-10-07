import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Keeps docs/mobile-parity.md complete: every web page route and every
// ShellDestination kind needs a row, and every row needs a valid status.
const DOC_PATH = 'docs/mobile-parity.md';
const DEEP_LINKS_PATH = 'packages/shared/src/notification-deep-links.ts';
const WEB_APP_DIR = 'apps/web/app';
const STATUS = /^(native screen|web-only|N\/A)(?=$|[\s(:,;.-])/;

interface Row {
  surface: string;
  kind: string;
  status: string;
  notes: string;
}

function readDocRows(): Row[] {
  const text = readFileSync(DOC_PATH, 'utf8').replace(/\r\n/g, '\n');
  const rows: Row[] = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .slice(1, line.lastIndexOf('|'))
      .split(' | ')
      .map((c) => c.trim());
    if (cells.length !== 4) continue;
    if (cells[0] === 'Surface' || /^-+$/.test(cells[0].replace(/\|/g, ''))) continue;
    if (cells[0].startsWith('---')) continue;
    rows.push({ surface: cells[0], kind: cells[1], status: cells[2], notes: cells[3] });
  }
  return rows;
}

function strip(cell: string): string {
  return cell.replace(/^`|`$/g, '');
}

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(full));
    else if (entry.name === 'page.tsx') out.push(full);
  }
  return out;
}

function routeFor(file: string): string {
  const rel = file.replace(/\\/g, '/').slice(WEB_APP_DIR.length);
  const segments = rel
    .split('/')
    .filter((s) => s !== '' && s !== 'page.tsx' && !/^\(.*\)$/.test(s));
  return `/${segments.join('/')}`;
}

function shellDestinationKinds(): string[] {
  const src = readFileSync(DEEP_LINKS_PATH, 'utf8').replace(/\r\n/g, '\n');
  const start = src.indexOf('export type ShellDestination');
  const end = src.indexOf(';\n', start);
  expect(start, `ShellDestination type not found in ${DEEP_LINKS_PATH}`).toBeGreaterThanOrEqual(0);
  const block = src.slice(start, end);
  return [...block.matchAll(/\{\s*kind:\s*'([a-z-]+)'/g)].map((m) => m[1]);
}

describe('docs/mobile-parity.md', () => {
  const rows = readDocRows();

  it('parses a non-empty table', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it('has a row for every ShellDestination kind', () => {
    const kinds = shellDestinationKinds();
    expect(kinds.length).toBeGreaterThan(0);
    const missing = kinds.filter(
      (k) => !rows.some((r) => r.kind === 'deep-link kind' && strip(r.surface) === `kind: '${k}'`),
    );
    expect(
      missing,
      `ShellDestination kind(s) missing from ${DOC_PATH}: ${missing.join(', ')}. Add a row (Kind "deep-link kind", Surface \`kind: '<kind>'\`) to ${DOC_PATH}.`,
    ).toEqual([]);
  });

  it('has a row for every apps/web page.tsx route', () => {
    const routes = pageFiles(WEB_APP_DIR).map(routeFor);
    expect(routes.length).toBeGreaterThan(0);
    const missing = routes.filter(
      (route) => !rows.some((r) => r.kind === 'route' && strip(r.surface) === route),
    );
    expect(
      missing,
      `Web route(s) missing from ${DOC_PATH}: ${missing.join(', ')}. Add a row (Kind "route") to ${DOC_PATH} with its native status.`,
    ).toEqual([]);
  });

  it('gives every row an allowed native status', () => {
    const bad = rows
      .filter((r) => !STATUS.test(r.status))
      .map((r) => `${r.surface} -> "${r.status}"`);
    expect(
      bad,
      `Row(s) in ${DOC_PATH} with an invalid Native status (must start with "native screen", "web-only" or "N/A"): ${bad.join('; ')}`,
    ).toEqual([]);
  });

  it('names an existing apps/mobile file for every native screen row', () => {
    const bad: string[] = [];
    for (const r of rows) {
      if (!r.status.startsWith('native screen')) continue;
      const m = r.status.match(/`(apps\/mobile\/[^`]+)`/);
      if (!m || !existsSync(m[1])) bad.push(`${r.surface} -> ${m ? m[1] : 'no file named'}`);
    }
    expect(
      bad,
      `"native screen" row(s) in ${DOC_PATH} must name an existing apps/mobile file: ${bad.join('; ')}`,
    ).toEqual([]);
  });
});
