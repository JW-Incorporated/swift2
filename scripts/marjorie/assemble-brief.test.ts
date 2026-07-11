import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildBrief, extractField, extractOptions } from './assemble-brief.mjs';

const NOW = new Date('2026-07-12T13:00:00Z').getTime();

const formBody = [
  '### Context',
  'We need a thing decided.',
  '### Options',
  'A) Do the safe thing (recommended)',
  'B) Do the fast thing',
  '### Recommendation + why',
  'A, because safety.',
  '### Cost of delay',
  'Copy desk idles on persona names.',
  '### Affects',
  '#463 #480',
  '### Tier',
  'T2 — banked for the daily brief (default)',
].join('\n');

const emptyState = { decisions: [], intake: [], alerts: [], openPRs: [], mergedPRs: [] };

describe('extractOptions', () => {
  it('pulls lettered options from a form body', () => {
    expect(extractOptions(formBody)).toEqual([
      'A) Do the safe thing (recommended)',
      'B) Do the fast thing',
    ]);
  });
  it('returns [] for unparseable bodies instead of guessing', () => {
    expect(extractOptions('free-text ramble with no headings')).toEqual([]);
    expect(extractOptions(undefined)).toEqual([]);
  });
});

describe('extractField', () => {
  it('pulls a named form field', () => {
    expect(extractField(formBody, 'Cost of delay')).toBe('Copy desk idles on persona names.');
    expect(extractField(formBody, 'Affects')).toBe('#463 #480');
  });
  it('is empty for a missing field', () => {
    expect(extractField(formBody, 'Deadline')).toBe('');
  });
});

describe('buildBrief', () => {
  it('renders a decision as unchecked boxes with cost and affects', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        decisions: [{ number: 501, title: '[decision] Persona names', body: formBody, createdAt: '2026-07-12T01:00:00Z' }],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('# Founders’ Brief — 2026-07-12'.replace('’', "'"));
    expect(brief).toContain('### #501 — Persona names');
    expect(brief).toContain('- [ ] A) Do the safe thing (recommended)');
    expect(brief).not.toContain('- [x]'); // nothing may ever be pre-ticked
    expect(brief).toContain('Cost of delay: Copy desk idles on persona names.');
    expect(brief).toContain('Unblocks: #463 #480');
  });

  it('flags intake items older than 48h', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        intake: [
          { number: 1, title: 'old drop', body: '', createdAt: '2026-07-09T00:00:00Z' },
          { number: 2, title: 'fresh drop', body: '', createdAt: '2026-07-12T09:00:00Z' },
        ],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('Intake queue: 2 open — ⚠ 1 older than 48h untriaged');
  });

  it('says so when nothing needs the founders', () => {
    const brief = buildBrief(emptyState, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('_Nothing needs you today._');
    expect(brief).toContain('none 🟢');
  });

  it('separates merged-today from open PRs', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        openPRs: [{ number: 9, title: 'wip thing', isDraft: true, createdAt: '2026-07-11T00:00:00Z', author: { login: 'x' } }],
        mergedPRs: [
          { number: 7, title: 'landed today', mergedAt: '2026-07-12T08:00:00Z' },
          { number: 3, title: 'landed last week', mergedAt: '2026-07-05T08:00:00Z' },
        ],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('- #7 landed today');
    expect(brief).not.toContain('- #3 landed last week');
    expect(brief).toContain('- #9 wip thing — draft');
  });
});
