import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { FALLBACK_SYSTEM } from './cascade.mjs';
import { CLASS_BY_OPTION, CLASS_OPTIONS, questionsFor } from './questions.mjs';

const classQuestion = questionsFor('news').find((q: { id: string }) => q.id === 'q_class') as { instructions: string; options: { id: string }[] };

describe('Tidewatch D-c prompt text', () => {
  for (const [name, text] of [['Q_CLASS', () => classQuestion.instructions], ['FALLBACK_SYSTEM', () => FALLBACK_SYSTEM]] as const) {
    it(`${name} carries the D-c key phrases`, () => {
      const t = text().toLowerCase();
      for (const phrase of ['tracklist', 'new planned tour', 'premiere', 'pre-order']) expect(t).toContain(phrase);
    });
  }

  it('FALLBACK_SYSTEM covers the required negative exemplars', () => {
    expect(FALLBACK_SYSTEM).toMatch(/VMA stage" => normal_news/);
    expect(FALLBACK_SYSTEM).toMatch(/premiere set for Tuesday" => normal_news/);
    expect(FALLBACK_SYSTEM).toMatch(/Pre-orders open[^"]*" => official_drop/);
    expect(FALLBACK_SYSTEM).toMatch(/fans speculate" => rumor/);
    expect(FALLBACK_SYSTEM).toMatch(/no confirmation from her team" => rumor/);
  });

  it('q_speculation exempts official announcements', () => {
    const q = questionsFor('news').find((x: { id: string }) => x.id === 'q_speculation') as { instructions: string };
    expect(q.instructions).toContain('not speculation');
  });

  it('option ids match origin/main', () => {
    const old = execFileSync('git', ['show', 'origin/main:scripts/tidewatch/questions.mjs'], { encoding: 'utf8' });
    const oldOptionIds = [...old.matchAll(/^\s*\['([a-z_]+)', '/gm)].map((m) => m[1]).slice(0, 13);
    expect(CLASS_OPTIONS.map((o: { id: string }) => o.id)).toEqual(oldOptionIds);
    expect(classQuestion.options.map((o) => o.id).sort()).toEqual([...oldOptionIds].sort());
    const oldMap = Object.fromEntries([...old.slice(old.indexOf('CLASS_BY_OPTION')).matchAll(/^\s*([a-z_]+): '([a-z_]+)',/gm)].slice(0, 13).map((m) => [m[1], m[2]]));
    expect(CLASS_BY_OPTION).toEqual(oldMap);
  });
});
