// Test-only. A minimal in-memory git for the poll/notifier tests: trees
// keyed by SHA, `diff --name-only` computed from them, `show <sha>:<path>`
// read from them, `rm` unlinking the working copy like the real thing, and
// `commit` snapshotting the staged paths from disk (under `root`) into a
// new head SHA. Ledger-branch commits (only social/feedback staged) never
// move the PR head, mirroring the real branch switch. Not a vitest file
// itself (no `.test.ts` suffix), so the runner never collects it.
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';

export type Tree = Record<string, string | null>;

export function makeFakeGit({ trees, head, root }: { trees: Record<string, Tree>; head: string; root: string }) {
  const calls: string[][] = [];
  const state = { head, trees: { ...trees } as Record<string, Tree>, staged: [] as string[], commits: 0 };
  const impl = vi.fn((args: string[]) => {
    calls.push(args);
    const [cmd] = args;
    if (cmd === 'rev-parse' && args[1] === 'HEAD') return state.head;
    if (cmd === 'show') {
      const [sha, ...rest] = args[1].split(':');
      const p = rest.join(':');
      const tree = sha.startsWith('origin/') ? undefined : state.trees[sha];
      if (!tree || tree[p] === undefined || tree[p] === null) throw new Error(`fatal: path '${p}' does not exist in '${sha}'`);
      return tree[p];
    }
    if (cmd === 'diff' && args[1] === '--name-only') {
      const a = state.trees[args[2]];
      const b = state.trees[args[3]];
      if (!a || !b) throw new Error(`fatal: bad object ${!a ? args[2] : args[3]}`);
      const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
      return [...paths].filter((p) => (a[p] ?? null) !== (b[p] ?? null)).sort().join('\n');
    }
    if (cmd === 'rm') {
      rmSync(path.join(root, args[1]), { force: true });
      state.staged.push(args[1]);
      return '';
    }
    if (cmd === 'add') {
      state.staged.push(...args.slice(1));
      return '';
    }
    if (cmd === 'commit') {
      const staged = state.staged;
      state.staged = [];
      if (staged.length > 0 && staged.every((p) => p.startsWith('social/feedback/'))) return '';
      const next: Tree = { ...state.trees[state.head] };
      for (const p of staged) {
        const abs = path.join(root, p);
        next[p] = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
      }
      state.commits += 1;
      const sha = `c${state.commits}`.padEnd(40, '0');
      state.trees[sha] = next;
      state.head = sha;
      return '';
    }
    return '';
  });
  return { impl, calls, state };
}
