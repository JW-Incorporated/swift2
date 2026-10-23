import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module
import { computeCalibration, renderMarkdown } from './calibration-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const config = JSON.parse(await readFile(path.join(ROOT, 'config/tidewatch.json'), 'utf8'));
const NOW = new Date('2026-10-18T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

const generalNews = (p: number) => ({
  q_class: { type: 'choice', optionId: 'general_news', probabilities: { general_news: p } },
});

let seq = 0;
const row = (overrides: Record<string, unknown> = {}) => ({
  id: `d${seq++}`, class: 'normal_news', confidence: 1, decider: 'jev', answers: { jev: generalNews(0.9) },
  decided_at: hoursAgo(1), action: 'shadow_only', ...overrides,
});

describe('computeCalibration', () => {
  const rows = [
    row({ answers: { jev: generalNews(0.95) } }),
    row({ answers: { jev: generalNews(0.9) } }),
    row({ answers: { jev: generalNews(0.5) } }),
    row({
      answers: { jev: generalNews(0.3), haiku: { class: 'normal_news', injection: 'no', drift: false } },
      decider: 'haiku', decided_at: hoursAgo(30),
    }),
    row({
      answers: { jev: generalNews(0.2), haiku: { class: 'noise', injection: 'no', drift: false } },
      decider: 'haiku', class: 'noise', action: 'shadow_hold_injection',
    }),
    row({ answers: { jev: generalNews(0.92), haiku: { class: 'normal_news', injection: 'no', drift: true } } }),
    row({ answers: { jev: generalNews(0.91), haiku: { class: 'noise', injection: 'no', drift: true } } }),
    row({ decider: 'code', class: 'duplicate', answers: {} }),
  ];
  const report = computeCalibration({ rows, now: NOW, config });
  const news = report.classes.normal_news;

  it('bins Jev confidence by 0.1 across jev and haiku rows', () => {
    expect(news.jevConfidenceHistogram.map((b: { count: number }) => b.count)).toEqual([0, 0, 1, 1, 0, 1, 0, 0, 0, 4]);
  });

  it('splits agreement by drift', () => {
    expect(news.agreement.drift_sample).toEqual({ total: 2, agree: 1, disagree: 1 });
    expect(news.agreement.below_threshold).toEqual({ total: 2, agree: 1, disagree: 1 });
    expect(news.haikuClassBelowThreshold).toEqual({ noise: 1, normal_news: 1 });
  });

  it('excludes code rows from model counts and histograms', () => {
    expect(report.classes.duplicate.deciders).toEqual({ code: 1, jev: 0, haiku: 0 });
    expect(report.classes.duplicate.jevConfidenceHistogram.every((b: { count: number }) => b.count === 0)).toBe(true);
    expect(report.haikuShare.cumulative).toEqual({ haiku: 2, model: 7, rate: 2 / 7 });
    expect(report.haikuShare.h24.haiku).toBe(1);
    expect(news.injectionHolds).toBe(1);
  });

  it('leaks no text, urls or ids', () => {
    const noisy = row({
      id: 'secret-id', title: 'Secret Title', url: 'https://example.com/x', excerpt: 'private text',
      answers: { jev: generalNews(0.9), text: 'private text' },
    });
    const out = computeCalibration({ rows: [noisy], now: NOW, config });
    const dump = JSON.stringify(out) + renderMarkdown(out);
    expect(dump).not.toMatch(/Secret Title|example\.com|private text|secret-id|http/);
  });
});
