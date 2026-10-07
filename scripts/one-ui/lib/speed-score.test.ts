import { describe, expect, it } from 'vitest';
import {
  launchMs,
  parseComment,
  parseGhPages,
  renderTable,
  scoreComments,
  verdictFor,
} from './speed-score.mjs';

const head = (launch: string, speedRows: string[]) =>
  [
    '**[diag] device timing report**',
    '',
    '| Field | Value |',
    '|---|---|',
    '| Model | `Pixel 10 Pro` |',
    '| OS | `android 16` |',
    '| Build | `1.0.0 (18)` |',
    '| Update id | `embedded` |',
    `| Launch | ${launch} |`,
    ...speedRows,
    '',
  ].join('\n');

const launchComment = (
  run: string,
  i: number,
  kind: 'cold' | 'warm',
  ms: number,
  img?: number,
) => ({
  body: [
    head(kind, [
      `| Speed test | run \`${run}\`, launch ${i} of 10 |`,
      '| UI | shared |',
      '| Clock starts at | native process start |',
      ...(img !== undefined ? [`| Images loaded by T+10 s | ${img} |`] : []),
    ]),
    '| Timing | ms |',
    '|---|---|',
    '| `native-lead` | 100.0 |',
    ...(kind === 'cold'
      ? [`| \`at:first-era-paint\` | ${ms - 100}.0 |`, '| `at:first-image-paint` | 1500.0 |']
      : [`| \`at:resume-paint\` | ${ms}.0 |`]),
    '',
    '<!-- diag:v1 -->',
  ].join('\n'),
});

const summaryComment = (run: string, launches: { k: string; ms: number }[]) => ({
  body: [
    head('unknown', [
      `| Speed test | run \`${run}\`, summary of ${launches.length} |`,
      '| UI | shared |',
    ]),
    '| Launch | Kind | ms |',
    '|---|---|---|',
    ...launches.map((l, i) => `| ${i + 1} | ${l.k} | ${l.ms.toFixed(1)} |`),
    '',
    '<!-- diag:v1 -->',
  ].join('\n'),
});

const legacy = {
  body: head('warm', []) + '| Timing | ms |\n|---|---|\n| `at:first-era-paint` | 888.4 |\n',
};

const ten = (cold: number, warm: number) => [
  ...Array.from({ length: 5 }, () => ({ k: 'cold', ms: cold })),
  ...Array.from({ length: 5 }, () => ({ k: 'warm', ms: warm })),
];

describe('parseComment', () => {
  it('ignores non-diag comments and flags legacy format', () => {
    expect(parseComment('hello')).toBeNull();
    expect(parseComment(legacy.body)?.speed).toBeNull();
  });

  it('reads launch metadata and timings', () => {
    const r = parseComment(launchComment('abcdef01', 3, 'cold', 2000, 4).body);
    expect(r?.speed).toMatchObject({
      run: 'abcdef01',
      kind: 'launch',
      index: 3,
      ui: 'shared',
      anchor: 'native',
      images10s: 4,
    });
    expect(launchMs(r)).toBe(2000);
  });

  it('reads summary launches', () => {
    const r = parseComment(summaryComment('abcdef01', ten(2000, 500)).body);
    expect(r?.speed?.kind).toBe('summary');
    expect(r?.speed?.launches).toHaveLength(10);
  });
});

describe('verdictFor', () => {
  it('PASS, FAIL on either bar, INCOMPLETE under 5 per kind', () => {
    expect(verdictFor(ten(2500, 1000)).verdict).toBe('PASS');
    expect(verdictFor(ten(2500.1, 500)).verdict).toBe('FAIL');
    expect(verdictFor(ten(2000, 1001)).verdict).toBe('FAIL');
    expect(verdictFor(ten(2000, 500).slice(1)).verdict).toBe('INCOMPLETE');
  });
});

describe('scoreComments', () => {
  it('prefers the summary and groups by run', () => {
    const { runs, legacy: n } = scoreComments([
      legacy,
      summaryComment('aaaaaaaa', ten(2600, 500)),
      launchComment('bbbbbbbb', 1, 'cold', 2000, 3),
    ]);
    expect(n).toBe(1);
    expect(runs.find((r) => r.run === 'aaaaaaaa')).toMatchObject({
      verdict: 'FAIL',
      cold: 2600,
      source: 'summary',
    });
    expect(runs.find((r) => r.run === 'bbbbbbbb')).toMatchObject({
      verdict: 'INCOMPLETE',
      source: 'launches',
      cold: 2000,
      firstImageMsWorst: 1500,
      images10sMin: 3,
    });
  });

  it('recomputes from launch reports when no summary exists', () => {
    const cs = ten(2000, 500).map((l, i) =>
      launchComment('cccccccc', i + 1, l.k as 'cold' | 'warm', l.ms),
    );
    expect(scoreComments(cs).runs[0].verdict).toBe('PASS');
  });

  it('handles only-legacy input and renders a table', () => {
    const s = scoreComments([legacy]);
    expect(s.runs).toEqual([]);
    expect(renderTable(s)).toContain('INCOMPLETE');
    expect(renderTable(s)).toContain('skipped (no speed-test metadata): 1');
  });
});

describe('parseGhPages', () => {
  it('joins concatenated pages', () => {
    expect(parseGhPages('[{"a":1}][{"a":2}]')).toHaveLength(2);
    expect(parseGhPages('')).toEqual([]);
  });
});
