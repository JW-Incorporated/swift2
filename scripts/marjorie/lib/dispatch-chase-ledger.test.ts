import { expect, it } from 'vitest';
import { main } from './dispatch-chase-ledger.mjs';
it('allocates from refreshed main instead of the currently checked out HA branch', async () => {
  const calls: string[][] = []; const output: unknown[] = [];
  const exec = (cmd: string, args: string[]) => { calls.push([cmd, ...args]); return args[1] === 'origin/main:HUMAN-ACTIONS.md' ? '## #9 Open' : '- #10 done'; };
  const fetchState = async (_repo: string, options: { readFileImpl: (file: string) => Promise<string> }) => ({ openActions: await options.readFileImpl('HUMAN-ACTIONS.md'),
    doneActions: await options.readFileImpl('HUMAN-ACTIONS-DONE.md'), pendingHaPrs: [{ actionsText: '## #11 Pending' }] });
  expect(await main(['allocate'], { repo: 'owner/repo', exec, fetchState, log: (x: unknown) => output.push(x) })).toBe(0);
  expect(output).toEqual([12]);
  expect(calls[0]).toEqual(['git', 'fetch', 'origin', 'main']);
  expect(await main(['check', '11'], { repo: 'owner/repo', exec, fetchState, log: () => {} })).toBe(0);
  expect(await main(['check', '10'], { repo: 'owner/repo', exec, fetchState, log: () => {} })).toBe(1);
});
