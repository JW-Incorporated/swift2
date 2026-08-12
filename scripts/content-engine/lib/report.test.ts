import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderFilingStatus, parseFilingStatus, appendFilingStatus } from './report.mjs';

// The run report is the artefact a human (and the watchdog) reads to decide
// whether a nightly was healthy. On 2026-07-26 and 2026-08-09 it said nothing
// at all about the ~1,220 findings that had just been discarded.

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
