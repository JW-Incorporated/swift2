import { describe, expect, it } from 'vitest';
import {
  resolveCharterDoc,
  extractRubric,
  classifyRubric,
  mergedPrsInWindow,
  selectPrsToSample,
  normalizeScore,
  buildQualitySection,
  scorePrWithClaude,
  MAX_PRS_PER_ROUTINE,
  MAX_PRS_PER_WEEK,
} from './routine-quality-sample.mjs';

describe('resolveCharterDoc', () => {
  it('extracts the charter path from an explicit "runtime contract is" line', () => {
    const text = 'Your runtime contract is docs/agents/austin.md in this repo — read it FIRST.';
    expect(resolveCharterDoc(text)).toBe('docs/agents/austin.md');
  });

  it('extracts a backtick-quoted "runtime contract is" charter path', () => {
    const text = 'Your runtime contract is `docs/agents/tree.md` — read it FIRST.';
    expect(resolveCharterDoc(text)).toBe('docs/agents/tree.md');
  });

  it('falls back to a "read <path>.md" mention when there is no runtime-contract line', () => {
    const text =
      'Do NOT read docs/kevin.md until step 3 says to.\nStep 3: read docs/kevin.md and act.';
    expect(resolveCharterDoc(text)).toBe('docs/kevin.md');
  });

  it('prefers the runtime-contract phrasing over an earlier unrelated "read" mention', () => {
    const text = 'First read the ticket. Your runtime contract is docs/agents/nils.md.';
    expect(resolveCharterDoc(text)).toBe('docs/agents/nils.md');
  });

  it('returns null when neither pattern is present', () => {
    expect(resolveCharterDoc('You are Karen. Run the nightly scan.')).toBeNull();
  });
});

describe('extractRubric', () => {
  it('extracts rubric text bounded by the next heading', () => {
    const text =
      '# Charter\n\n## Sampling rubric\n\nScore 1-3, one sentence.\n\n## Migrating to a service\n\nMore text.';
    expect(extractRubric(text)).toBe('Score 1-3, one sentence.');
  });

  it('extracts rubric text that runs to end of file', () => {
    const text = '# Charter\n\n## Sampling rubric\n\nScore 1-3, one sentence.\n';
    expect(extractRubric(text)).toBe('Score 1-3, one sentence.');
  });

  it('returns null when the heading is absent', () => {
    expect(extractRubric('# Charter\n\n## Budget\n\nSome text.')).toBeNull();
  });

  it('does not match the heading text mentioned in running prose', () => {
    expect(extractRubric('See the ## Sampling rubric section above for scoring.')).toBeNull();
  });
});

describe('classifyRubric', () => {
  it('flags a routine with no Tier-2 identifier as unsampleable', () => {
    const result = classifyRubric({ identifier: null });
    expect(result.rubric).toBeNull();
    expect(result.reason).toContain('no `Tier-2:` attribution tag');
  });

  it('flags a routine whose prompt names no charter doc', () => {
    const result = classifyRubric({ identifier: 'Vault Run', charterDoc: null });
    expect(result.rubric).toBeNull();
    expect(result.reason).toContain('names no charter doc');
  });

  it('flags a routine whose charter doc could not be read', () => {
    const result = classifyRubric({
      identifier: 'Austin',
      charterDoc: 'docs/agents/austin.md',
      charterText: null,
    });
    expect(result.rubric).toBeNull();
    expect(result.reason).toContain('could not be read');
  });

  it('flags a routine whose charter doc has no rubric heading', () => {
    const result = classifyRubric({
      identifier: 'Karen',
      charterDoc: 'docs/agents/karen.md',
      charterText: '# Karen\n\n## Budget\n\ntext',
    });
    expect(result.rubric).toBeNull();
    expect(result.reason).toContain('no "## Sampling rubric" heading');
  });

  it('returns the rubric text when everything resolves', () => {
    const result = classifyRubric({
      identifier: 'Austin',
      charterDoc: 'docs/agents/austin.md',
      charterText: '# Austin\n\n## Sampling rubric\n\nScore 1-3.\n\n## Budget\n',
    });
    expect(result.reason).toBeNull();
    expect(result.rubric).toBe('Score 1-3.');
  });
});

describe('mergedPrsInWindow', () => {
  const now = new Date('2026-09-10T00:00:00.000Z');

  it('keeps only merged PRs opened within the window', () => {
    const prs = [
      {
        number: 1,
        state: 'MERGED',
        createdAt: '2026-09-08T00:00:00.000Z',
        closedAt: '2026-09-09T00:00:00.000Z',
      },
      { number: 2, state: 'OPEN', createdAt: '2026-09-08T00:00:00.000Z', closedAt: null },
      {
        number: 3,
        state: 'MERGED',
        createdAt: '2026-08-01T00:00:00.000Z',
        closedAt: '2026-08-02T00:00:00.000Z',
      },
    ];
    expect(mergedPrsInWindow(prs, now)).toEqual([prs[0]]);
  });
});

describe('selectPrsToSample', () => {
  it('caps each routine at MAX_PRS_PER_ROUTINE, most-recently-merged first', () => {
    const routines = [
      {
        name: 'routine-austin-build',
        mergedPrs: [
          { number: 1, closedAt: '2026-09-08T00:00:00.000Z' },
          { number: 2, closedAt: '2026-09-09T00:00:00.000Z' },
          { number: 3, closedAt: '2026-09-07T00:00:00.000Z' },
        ],
      },
    ];
    const [selection] = selectPrsToSample(routines);
    expect(selection.picked).toHaveLength(MAX_PRS_PER_ROUTINE);
    expect(selection.picked.map((p) => p.number)).toEqual([2, 1]);
  });

  it('never exceeds MAX_PRS_PER_WEEK across the whole fleet', () => {
    const routines = Array.from({ length: 20 }, (_, i) => ({
      name: `routine-${i}`,
      mergedPrs: [
        { number: i * 2, closedAt: '2026-09-08T00:00:00.000Z' },
        { number: i * 2 + 1, closedAt: '2026-09-09T00:00:00.000Z' },
      ],
    }));
    const selections = selectPrsToSample(routines);
    const total = selections.reduce((sum, s) => sum + s.picked.length, 0);
    expect(total).toBe(MAX_PRS_PER_WEEK);
    expect(total).toBeLessThan(20 * 2);
  });

  it('respects custom caps passed in directly', () => {
    const routines = [
      { name: 'a', mergedPrs: [{ number: 1, closedAt: '2026-09-09T00:00:00.000Z' }] },
      { name: 'b', mergedPrs: [{ number: 2, closedAt: '2026-09-09T00:00:00.000Z' }] },
      { name: 'c', mergedPrs: [{ number: 3, closedAt: '2026-09-09T00:00:00.000Z' }] },
    ];
    const selections = selectPrsToSample(routines, { maxPerRoutine: 1, maxTotal: 2 });
    expect(selections.map((s) => s.picked.length)).toEqual([1, 1, 0]);
  });

  it('leaves a routine with fewer merged PRs than the cap untouched', () => {
    const routines = [
      {
        name: 'routine-vault-run',
        mergedPrs: [{ number: 1, closedAt: '2026-09-09T00:00:00.000Z' }],
      },
    ];
    const [selection] = selectPrsToSample(routines);
    expect(selection.picked).toHaveLength(1);
  });
});

describe('normalizeScore', () => {
  it('accepts a valid 1-3 score with non-empty evidence', () => {
    expect(normalizeScore({ score: 2, evidence: 'Added a regression test in the diff.' })).toEqual({
      score: 2,
      evidence: 'Added a regression test in the diff.',
    });
  });

  it('rejects an out-of-range score', () => {
    expect(normalizeScore({ score: 5, evidence: 'x' })).toBeNull();
  });

  it('rejects empty or missing evidence', () => {
    expect(normalizeScore({ score: 1, evidence: '   ' })).toBeNull();
    expect(normalizeScore({ score: 1 })).toBeNull();
  });

  it('rejects a null or non-object response', () => {
    expect(normalizeScore(null)).toBeNull();
    expect(normalizeScore('not an object')).toBeNull();
  });
});

describe('buildQualitySection', () => {
  it('renders one row per scored PR with its score and evidence', () => {
    const section = buildQualitySection({
      date: '2026-09-14',
      scored: [
        {
          routineName: 'routine-austin-build',
          prNumber: 4200,
          prUrl: 'https://github.com/JW-Incorporated/swift2/pull/4200',
          score: 3,
          evidence: 'Added austin-build.test.ts covering the new branch.',
          error: null,
        },
      ],
      noRubric: [],
    });
    expect(section).toContain('## Quality sampling — 2026-09-14');
    expect(section).toContain('[#4200](https://github.com/JW-Incorporated/swift2/pull/4200)');
    expect(section).toContain('3 — Added austin-build.test.ts covering the new branch.');
    expect(section).toContain('Every routine with volume data had a rubric available this week.');
  });

  it('reports a failed scoring attempt explicitly instead of a blank cell', () => {
    const section = buildQualitySection({
      date: '2026-09-14',
      scored: [
        {
          routineName: 'routine-paul-blart',
          prNumber: 10,
          prUrl: 'https://github.com/JW-Incorporated/swift2/pull/10',
          score: null,
          evidence: null,
          error: 'ANTHROPIC_API_KEY is not set',
        },
      ],
      noRubric: [],
    });
    expect(section).toContain('not scored (ANTHROPIC_API_KEY is not set)');
  });

  it('escapes pipes and newlines in LLM-authored evidence so the table cannot break', () => {
    const section = buildQualitySection({
      date: '2026-09-14',
      scored: [
        {
          routineName: 'routine-austin-build',
          prNumber: 11,
          prUrl: 'https://github.com/JW-Incorporated/swift2/pull/11',
          score: 2,
          evidence: 'Added a | delimiter\nand a second line.',
          error: null,
        },
      ],
      noRubric: [],
    });
    const tableRows = section
      .split('\n')
      .filter((line) => line.startsWith('| routine-austin-build'));
    expect(tableRows).toHaveLength(1);
    expect(tableRows[0]).toContain('Added a \\| delimiter and a second line.');
  });

  it('lists every no-rubric routine explicitly, never silently', () => {
    const section = buildQualitySection({
      date: '2026-09-14',
      scored: [],
      noRubric: [
        {
          name: 'routine-karen-nightly',
          reason: 'its prompt file names no charter doc to hold a rubric',
        },
        { name: 'routine-kevin-daily-desk', reason: 'no `Tier-2:` attribution tag — unsampleable' },
      ],
    });
    expect(section).toContain(
      '- **routine-karen-nightly**: its prompt file names no charter doc to hold a rubric.',
    );
    expect(section).toContain(
      '- **routine-kevin-daily-desk**: no `Tier-2:` attribution tag — unsampleable.',
    );
    expect(section).toContain('no merged PRs in this window for any rubric-bearing routine');
  });
});

describe('scorePrWithClaude', () => {
  const rubric = 'Score 1-3, one evidence sentence.';
  const pr = {
    number: 42,
    title: 'Fix the thing',
    url: 'https://github.com/JW-Incorporated/swift2/pull/42',
    body: 'Closes #41.',
  };

  it('sends a single forced-tool request with thinking disabled on the cheap model', async () => {
    let request: Request | undefined;
    const response = await scorePrWithClaude({
      apiKey: 'test-key',
      routineName: 'routine-austin-build',
      rubric,
      pr,
      diffText: '+ added a test',
      fetchImpl: async (url: string, init: RequestInit) => {
        request = new Request(url, init);
        return new Response(
          JSON.stringify({
            content: [
              {
                type: 'tool_use',
                name: 'record_quality_score',
                input: { score: 3, evidence: 'Added a test.' },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const payload = (await request?.json()) as Record<string, unknown>;
    expect(payload).toMatchObject({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      thinking: { type: 'disabled' },
    });
    expect(payload.tool_choice).toEqual({ type: 'tool', name: 'record_quality_score' });
    expect(response).toEqual({ score: 3, evidence: 'Added a test.' });
  });

  it('truncates an oversized diff instead of sending it whole', async () => {
    let request: Request | undefined;
    const hugeDiff = '+'.repeat(30_000);
    await scorePrWithClaude({
      apiKey: 'test-key',
      routineName: 'routine-austin-build',
      rubric,
      pr,
      diffText: hugeDiff,
      fetchImpl: async (url: string, init: RequestInit) => {
        request = new Request(url, init);
        return new Response(
          JSON.stringify({
            content: [
              {
                type: 'tool_use',
                name: 'record_quality_score',
                input: { score: 2, evidence: 'x' },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const payload = (await request?.json()) as {
      messages: Array<{ content: Array<{ text: string }> }>;
    };
    const text = payload.messages[0].content[0].text;
    expect(text.length).toBeLessThan(hugeDiff.length);
    expect(text).toContain('diff truncated at 20000 characters');
  });
});
