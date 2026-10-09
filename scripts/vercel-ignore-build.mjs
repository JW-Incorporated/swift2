// Vercel Ignored Build Step CLI. Exit 1 = BUILD, exit 0 = SKIP (Vercel's
// own convention, inverted from a normal script's).
//
// Wired from apps/web/vercel.json's `ignoreCommand`, so it runs with the CWD
// at the project root directory (apps/web) while the git repo is one level
// up — hence the `--show-toplevel` hop before any diff.
//
// Every uncertainty fails OPEN (builds): no git, an unresolvable base sha, a
// shallow clone with no parent commit, an empty diff, a diff command that
// errors, or VERCEL_ENV=production. The decision itself lives in
// scripts/lib/vercel-ignore-build.mjs — see that file's header for the
// deny-list-not-allow-list reasoning and the measurements behind it.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { decide } from './lib/vercel-ignore-build.mjs';

function git(args, cwd) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return res.stdout;
}

/** The commit the deployment should diff against, or null if we cannot tell. */
export function resolveBase(env, run) {
  const previous = (env.VERCEL_GIT_PREVIOUS_SHA || '').trim();
  if (previous && run(['cat-file', '-e', `${previous}^{commit}`]) !== null) return previous;
  if (run(['rev-parse', '--verify', 'HEAD^']) !== null) return 'HEAD^';
  return null;
}

export function main(env = process.env, log = console.log) {
  const top = git(['rev-parse', '--show-toplevel'], process.cwd());
  if (env.VERCEL_ENV === 'production') return finish(decide({ vercelEnv: 'production' }), log);
  if (!top) return finish(decide({ diffError: 'not a git checkout' }), log);
  const root = top.trim();
  const run = (args) => git(args, root);

  const base = resolveBase(env, run);
  if (!base) return finish(decide({ diffError: 'no resolvable base commit (shallow clone?)' }), log);

  const out = run(['diff', '--name-only', base, 'HEAD']);
  if (out === null) return finish(decide({ diffError: `git diff ${base}..HEAD failed` }), log);

  return finish(decide({ vercelEnv: env.VERCEL_ENV, files: out.split('\n') }), log);
}

function finish(verdict, log) {
  log(`[vercel-ignore-build] ${verdict.build ? 'BUILD' : 'SKIP'}: ${verdict.reason}`);
  return verdict.build ? 1 : 0;
}

// Windows paths never form a valid file:// URL by concatenation, so compare
// resolved URLs — importing this module (the tests do, for resolveBase) must
// never reach process.exit().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
