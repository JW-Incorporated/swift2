import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { renderFilingStatus, parseFilingStatus, appendFilingStatus, writeReport, parseRunProvenance } from './report.mjs';
import { ROOT } from './corpus.mjs';

// The run report is the artefact a human (and the watchdog) reads to decide
// whether a nightly was healthy. On 2026-07-26 and 2026-08-09 it said nothing
// at all about the ~1,220 findings that had just been discarded.

describe('writeReport provenance + routing (docs/decisions.md 2026-08-14)', () => {
  it('stamps source into a grep-able cie-run marker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cie-report-'));
    const reportDir = relative(ROOT, dir);
    const path = await writeReport([], {
      date: '2026-08-20', itemCount: 1, imageCount: 1, checkers: ['x'],
      source: 'scan', reportDir,
    });
    const text = await readFile(path, 'utf8');
    expect(parseRunProvenance(text)).toMatchObject({ source: 'scan', date: '2026-08-20' });
  });

  it('defaults to the canonical reportsDir when no override is given', async () => {
    // A far-future date so this can never collide with a real committed report;
    // try/finally guarantees the write is removed even if an assertion fails.
    const { rm } = await import('node:fs/promises');
    const p = await writeReport([], {
      date: '2099-01-01', itemCount: 1, imageCount: 1, checkers: ['x'], source: 'all',
    });
    try {
      expect(p.replace(/\\/g, '/')).toContain('docs/audits/engine/2099-01-01-cie-run.md');
      const text = await readFile(p, 'utf8');
      expect(parseRunProvenance(text)).toMatchObject({ source: 'all' });
    } finally {
      await rm(p, { force: true });
    }
  });
});

describe('parseRunProvenance', () => {
  it('returns null for a report with no marker', () => {
    expect(parseRunProvenance('# Content Integrity Engine — run 2026-08-09\n\nTotals: 859 findings')).toBeNull();
  });
});

describe('renderFilingStatus', () => {
  it('marks a clean run ok and states the counts', () => {
    const md = renderFilingStatus({ filed: 20, deduped: 10, unfiled: [], detected: 30 });
    expect(md).toContain('Ticket filing — ✅ complete');
    expect(md).toContain('**20 new issue(s) filed · 10 already on the tracker · 0 unfiled.**');
    expect(parseFilingStatus(md)).toEqual({ status: 'ok', filed: 20, deduped: 10, unfiled: 0 });
  });

  it('screams when findings were detected and not filed', () => {
    const md = renderFilingStatus({
      filed: 3,
      deduped: 1,
      detected: 30,
      unfiled: [{ title: '[CIE P1] a', reason: 'issue create failed: 401 Bad credentials' }],
    });
    expect(md).toContain('🚨 TICKET FILING FAILED');
    expect(md).toContain('This run is a FAILURE');
    expect(md).toContain('401 Bad credentials');
    expect(parseFilingStatus(md)).toMatchObject({ status: 'failed', unfiled: 1 });
  });

  it('counts EVERY filable finding as lost when filing never got off the ground', () => {
    // 2026-08-09 exactly: the preflight/credential died, so `unfiled` is empty
    // only because nothing was ever attempted. The report must not read "0 lost".
    const md = renderFilingStatus({
      filed: 0,
      deduped: 0,
      unfiled: [],
      detected: 597,
      fatal: '401 Bad credentials',
    });
    expect(parseFilingStatus(md)).toMatchObject({ status: 'fatal', unfiled: 597 });
    expect(md).toContain('597 finding(s) detected and NOT filed');
  });

  it('labels a dry run as such so it is never mistaken for a healthy filing run', () => {
    expect(
      parseFilingStatus(renderFilingStatus({ filed: 30, deduped: 0, unfiled: [], dryRun: true })),
    ).toMatchObject({ status: 'dry-run' });
  });
});

describe('parseFilingStatus', () => {
  it('returns null for a report with no marker — an aborted run, which is itself the alarm', () => {
    expect(
      parseFilingStatus('# Content Integrity Engine — run 2026-08-09\n\nTotals: 859 findings'),
    ).toBeNull();
  });
});

describe('appendFilingStatus', () => {
  it('appends once and replaces on a re-run, so `all` stays idempotent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cie-report-'));
    const path = join(dir, '2026-08-11-cie-run.md');
    await writeFile(path, '# report\n\nbody\n', 'utf8');

    await appendFilingStatus(path, {
      filed: 0,
      deduped: 0,
      unfiled: [],
      detected: 5,
      fatal: 'boom',
    });
    await appendFilingStatus(path, { filed: 5, deduped: 0, unfiled: [], detected: 5 });

    const text = await readFile(path, 'utf8');
    expect(text.match(/cie-filing:/g)).toHaveLength(1);
    expect(text).not.toContain('TICKET FILING FAILED');
    expect(text.startsWith('# report\n\nbody')).toBe(true);
    expect(parseFilingStatus(text)).toMatchObject({ status: 'ok', filed: 5 });
  });
});
