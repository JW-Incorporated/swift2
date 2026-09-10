// Global setup for the vitest render-test harness (R19).
//
// apps/web needs React 19 (apps/web/package.json pins react@^19.2.8), but
// this is an npm workspaces monorepo where OTHER workspaces pin different
// React majors/patches — apps/mobile pins an exact react@19.2.3 for
// Expo/react-native. npm's hoisting algorithm resolves that conflict by
// giving apps/web and apps/mobile their own nested node_modules/react
// copies and hoisting some THIRD version (currently 18.3.1, satisfying the
// loosest peer ranges) to the root node_modules/react.
//
// Everything that npm ALSO hoists to the root — @radix-ui/*, lucide-react,
// next itself (next/link), @testing-library/react — resolves its own
// internal `require('react')` from ITS location, i.e. the root's hoisted
// copy, not apps/web's. Two DIFFERENT React module instances in one render
// tree breaks hooks ("Invalid hook call") even when both report the same
// version number — React keeps its current-dispatcher state as module-level
// state, and two separate copies (even byte-identical ones at different
// paths) never share it. A plain file copy is not enough; the root's
// node_modules/react and node_modules/react-dom must be made to resolve to
// the EXACT SAME module instance apps/web imports, so this replaces them
// with symlinks into apps/web/node_modules — vitest.config.ts's
// resolve/test aliases only cover requires that route through Vite's own
// resolver, and plenty of transitive node_modules requires never do.
//
// Restored on teardown: the swap only needs to hold for the duration of
// this vitest run. Leaving the root's hoisted copy permanently replaced
// would silently change dependency resolution for every OTHER workspace
// (apps/mobile, apps/worker, packages/*) and any build/script that runs
// after the test suite in the same checkout — including CI's own later
// steps (`npm run lint`, `npm run typecheck --workspace @swift2/mobile`)
// in the same job. Never touches package.json/package-lock.json either
// way — no lockfile churn, no npm `overrides` conflict with apps/mobile's
// exact react pin.
import { existsSync, lstatSync, mkdirSync, realpathSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

/** Where an original (pre-swap) root copy is parked so teardown can restore it. */
function backupPathFor(dest: string): string {
  return `${dest}.pre-render-test-harness-backup`;
}

function symlinkPackage(name: string): void {
  const source = join(repoRoot, 'apps/web/node_modules', name);
  const dest = join(repoRoot, 'node_modules', name);
  if (!existsSync(source)) return;
  if (existsSync(dest)) {
    const alreadyLinked = lstatSync(dest).isSymbolicLink() && realpathSync(dest) === realpathSync(source);
    if (alreadyLinked) return;
    // Park the real root copy instead of deleting it, so teardown can put
    // dependency resolution back exactly as npm install left it.
    const backup = backupPathFor(dest);
    rmSync(backup, { recursive: true, force: true });
    renameSync(dest, backup);
  } else {
    mkdirSync(join(repoRoot, 'node_modules'), { recursive: true });
  }
  symlinkSync(source, dest, 'dir');
}

function restorePackage(name: string): void {
  const dest = join(repoRoot, 'node_modules', name);
  const backup = backupPathFor(dest);
  if (!existsSync(backup)) return;
  rmSync(dest, { recursive: true, force: true });
  renameSync(backup, dest);
}

export default function setup() {
  symlinkPackage('react');
  symlinkPackage('react-dom');
  return () => {
    restorePackage('react');
    restorePackage('react-dom');
  };
}

