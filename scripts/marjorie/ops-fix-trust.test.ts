import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { evaluate, main } from './ops-fix-trust.mjs';

describe('evaluate', () => {
  it('trusts a labeled issue from a bot', () => {
    expect(evaluate({ login: 'app/github-actions', labels: ['routine-failure'], role: '' }).ok).toBe(true);
    expect(evaluate({ login: 'claude[bot]', labels: ['marjorie-filed'], role: '' }).ok).toBe(true);
  });
  it('trusts a member with write or better', () => {
    for (const role of ['admin', 'maintain', 'write']) expect(evaluate({ login: 'joey', labels: ['marjorie-filed'], role }).ok).toBe(true);
  });
  it('rejects outsiders, triage/read roles and unlabeled issues', () => {
    expect(evaluate({ login: 'rando', labels: ['marjorie-filed'], role: '' }).ok).toBe(false);
    expect(evaluate({ login: 'rando', labels: ['marjorie-filed'], role: 'read' }).ok).toBe(false);
    expect(evaluate({ login: 'github-actions[bot]', labels: ['bug'], role: '' }).ok).toBe(false);
    expect(evaluate({ login: 'evil-github-actions', labels: ['routine-failure'], role: '' }).ok).toBe(false);
  });
});

describe('main', () => {
  const view = (login: string, label: string) => JSON.stringify({ author: { login }, labels: [{ name: label }] });
  it('exits 0 for a trusted issue and 1 for an untrusted one', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exec = (_c: string, a: string[]) => (a[0] === 'issue' ? view('joey', 'marjorie-filed') : 'write');
    expect(main(['5', '--repo', 'o/r'], exec)).toBe(0);
    const outsider = (_c: string, a: string[]) => {
      if (a[0] === 'issue') return view('rando', 'marjorie-filed');
      throw new Error('404');
    };
    expect(main(['5', '--repo', 'o/r'], outsider)).toBe(1);
    log.mockRestore();
  });
  it('fails closed when the lookup throws', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main(['5', '--repo', 'o/r'], () => { throw new Error('boom'); })).toBe(1);
    log.mockRestore();
  });
});
