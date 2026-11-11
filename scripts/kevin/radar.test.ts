import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  RADAR_CONFIDENCE,
  classifyFinding,
  handleRadar,
  main,
  parseSeen,
  renderRadarBody,
  selectCandidates,
} from './radar.mjs';

const NOW = new Date('2026-10-15T06:00:00Z');
const comment = (id: number, number: number, overrides: Record<string, unknown> = {}) => ({
  id,
  body: `Comment ${id}`,
  created_at: '2026-10-15T05:30:00Z',
  html_url: `https://github.com/o/r/issues/${number}#issuecomment-${id}`,
  issue_url: `https://api.github.com/repos/o/r/issues/${number}`,
  user: { login: 'sffan15-sys', type: 'User' },
  ...overrides,
});
const thread = (number: number, overrides: Record<string, unknown> = {}) => ({
  number,
  title: `Thread ${number}`,
  state: 'open',
  labels: [],
  ...overrides,
});
const choice = (kind = 'other', severity = 'informational', confidence = 0.9) => ({
  ask: vi.fn(async () => ({
    answers: {
      kind: { type: 'choice', optionId: kind, confidence, probabilities: {} },
      severity: { type: 'choice', optionId: severity, confidence, probabilities: {} },
    },
  })),
});

function apiFixture(comments: object[], threads: Record<number, object>, radar: object | null = null) {
  return vi.fn(async (url: string) => {
    if (url.includes('/issues/comments?')) return comments;
    if (url.includes('labels=kevin-radar')) return radar ? [radar] : [];
    const number = Number(url.match(/\/issues\/(\d+)$/)?.[1]);
    if (!threads[number]) throw new Error(`missing thread ${number}`);
    return threads[number];
  });
}

describe('Kevin radar mechanical checks', () => {
  it('parses the durable marker and filters a mixed hostile window deterministically', () => {
    const comments = [
      comment(1, 10),
      comment(2, 11, { user: { login: 'github-actions[bot]', type: 'Bot' } }),
      comment(3, 12),
      comment(4, 13),
      comment(5, 14, { created_at: '2026-10-15T04:49:59Z' }),
      comment(6, 15),
      comment(6, 15),
    ];
    const threads = new Map([
      [10, thread(10)],
      [11, thread(11)],
      [12, thread(12, { labels: [{ name: 'cie' }] })],
      [13, thread(13, { labels: ['user-feedback'] })],
      [14, thread(14)],
      [15, thread(15, { pull_request: { url: 'x' } })],
    ]);
    const seen = parseSeen('before <!-- seen: 1, 99 --> after');
    expect([...seen]).toEqual(['1', '99']);
    expect(selectCandidates(comments, threads, seen, NOW).map((item: { id: number }) => item.id)).toEqual([6]);
  });

  it('rejects ambiguous Jev choices at the named threshold', async () => {
    expect(RADAR_CONFIDENCE).toBe(0.72);
    const finding = { ...comment(7, 17), number: 17, thread: thread(17) };
    await expect(classifyFinding(finding, choice('other', 'informational', 0.71)))
      .resolves.toMatchObject({ handled: false, reason: 'low-confidence' });
    await expect(classifyFinding(finding, choice('other', 'unclear', 0.99)))
      .resolves.toMatchObject({ handled: false, reason: 'low-confidence' });
  });
});

describe('Kevin radar all-or-nothing handling', () => {
  it('handles an empty input without a Jev call or GitHub mutation', async () => {
    const client = choice();
    const gh = vi.fn();
    const log = vi.fn();
    await expect(handleRadar({ api: apiFixture([], {}), gh, client, now: NOW, log }))
      .resolves.toEqual({ handled: true, findings: [] });
    expect(client.ask).not.toHaveBeenCalled();
    expect(gh).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Stream 3 radar: no new comments');
  });

  it('fails open for a mixed batch when one finding needs agent judgment, without partial output', async () => {
    const comments = [comment(8, 18), comment(9, 19)];
    const api = apiFixture(comments, { 18: thread(18), 19: thread(19) });
    const client = {
      ask: vi.fn()
        .mockResolvedValueOnce(choiceResult('other', 'informational'))
        .mockResolvedValueOnce(choiceResult('decision_answer', 'actionable')),
    };
    const gh = vi.fn();
    await expect(handleRadar({ api, gh, client, now: NOW, log: vi.fn() }))
      .resolves.toMatchObject({ handled: false, reason: 'decision-needs-agent' });
    expect(gh).not.toHaveBeenCalled();
  });

  it('creates the same daily radar issue contract for a confident finding', async () => {
    const api = apiFixture(
      [comment(6185033881, 5828, { body: 'P0-01 acceptance test done.' })],
      { 5828: thread(5828, { title: 'P0-01 weekly-limit detection' }) },
    );
    const gh = vi.fn(async () => ({ stdout: '' }));
    const result = await handleRadar({ api, gh, client: choice(), now: NOW, log: vi.fn() });
    expect(result).toMatchObject({ handled: true });
    expect(result.body).toContain('**Issue #5828** — Joey: P0-01 acceptance test done.');
    expect(result.body).toContain('<!-- seen: 6185033881 -->');
    expect(result.body).toContain('Tier-2: Kevin — S3 comment radar');
    expect(gh).toHaveBeenNthCalledWith(1, expect.arrayContaining(['label', 'create', 'kevin-radar']));
    expect(gh).toHaveBeenNthCalledWith(2, expect.arrayContaining(['issue', 'create', '--title', 'Kevin Review Radar — 2026-10-15']));
  });

  it('preserves earlier findings while advancing the seen marker', () => {
    const old = 'Stream 3 comment radar run old.\n\n<!-- seen: 1 -->\n\n## Stream 3 activity\n\nold finding\n\n---\nTier-2: Kevin — S3 comment radar';
    const next = renderRadarBody(old, [{
      comment: { ...comment(2, 20), number: 20, thread: thread(20) },
      classification: { kind: 'other', severity: 'informational' },
    }], new Set(['1']), NOW);
    expect(next).toContain('old finding');
    expect(next).toContain('<!-- seen: 1,2 -->');
    expect(next.match(/Tier-2: Kevin — S3 comment radar/g)).toHaveLength(1);
  });

  it('addresses actionable notes to a founder and defuses quoted @mentions', () => {
    const body = renderRadarBody('', [{
      comment: { ...comment(3, 30, { body: 'ping @someone and @JW-Incorporated/team please' }), number: 30, thread: thread(30) },
      classification: { kind: 'other', severity: 'actionable' },
    }], new Set(), NOW);
    expect(body).toContain('needs a founder');
    expect(body).not.toContain('Wyatt');
    const zw = String.fromCharCode(0x200b);
    expect(body).toContain(`@${zw}someone`);
    expect(body).toContain(`@${zw}JW-Incorporated`);
    expect(body).not.toMatch(new RegExp(`@(?!${zw})\\w`));
  });
});

function choiceResult(kind: string, severity: string, confidence = 0.9) {
  return {
    answers: {
      kind: { type: 'choice', optionId: kind, confidence, probabilities: {} },
      severity: { type: 'choice', optionId: severity, confidence, probabilities: {} },
    },
  };
}

describe('Kevin radar CLI fail-open behavior', () => {
  it('writes handled=false when the key is absent, a read fails, or Jev times out', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kevin-radar-'));
    try {
      const output = path.join(dir, 'output');
      writeFileSync(output, '');
      const clientFactory = vi.fn();
      await main({ env: { GITHUB_OUTPUT: output }, clientFactory, log: vi.fn() });
      expect(readFileSync(output, 'utf8')).toBe('handled=false\n');
      expect(clientFactory).not.toHaveBeenCalled();

      writeFileSync(output, '');
      await main({
        env: { GITHUB_OUTPUT: output, TYPESAFE_API_KEY: 'fixture-secret' },
        api: vi.fn(async () => { throw new Error('read failed'); }),
        clientFactory: () => choice(),
        now: () => NOW,
        log: vi.fn(),
      });
      expect(readFileSync(output, 'utf8')).toBe('handled=false\n');

      writeFileSync(output, '');
      const gh = vi.fn();
      await main({
        env: { GITHUB_OUTPUT: output, TYPESAFE_API_KEY: 'fixture-secret' },
        api: apiFixture([comment(10, 20)], { 20: thread(20) }),
        gh,
        clientFactory: () => ({ ask: async () => { throw new Error('timeout'); } }),
        now: () => NOW,
        log: vi.fn(),
      });
      expect(readFileSync(output, 'utf8')).toBe('handled=false\n');
      expect(gh).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('routine-kevin-radar workflow', () => {
  const workflow = readFileSync('.github/workflows/routine-kevin-radar.yml', 'utf8').replace(/\r\n/g, '\n');

  it('always falls through to the unchanged agent when deterministic handling is not true', () => {
    expect(workflow).toContain('node scripts/kevin/radar.mjs');
    expect(workflow).toContain('TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}');
    expect(workflow).toContain('SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}');
    expect(workflow).toContain("if: always() && needs.deterministic.outputs.handled != 'true'");
    expect(workflow).toContain('prompt_file: docs/agents/runner-prompts/kevin-stream3-radar.md');
    expect(workflow).toContain('model: claude-haiku-5-5');
    expect(workflow).toContain('allowed_tools: "Bash,Read,Grep,Glob"');
  });
});
