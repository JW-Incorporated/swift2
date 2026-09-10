#!/usr/bin/env node
// `check:content-bundle` — the OS-011 guard mirroring
// scripts/check-generated-in-sync.mjs's own drift check, applied one layer
// up: instead of diffing a committed generated file against a fresh sync,
// this builds the content bundle TWICE (fresh temp dirs each time) and
// fails if bundleVersion or any individual file's bytes differ — the
// concrete, CI-runnable form of OS-011's "Done when: running it twice
// yields identical hashes."
//
// A real drift here (not just a flaky test) would mean
// scripts/build-content-bundle.mjs stopped being deterministic — e.g. a Set/
// object iteration order that isn't actually stable, or a Date.now() leaking
// into a content file instead of staying confined to manifest.generatedAt.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { writeBundle } from './build-content-bundle.mjs';
import { runMain } from './lib/cli.mjs';

async function main() {
  const dir1 = await mkdtemp(path.join(os.tmpdir(), 'check-content-bundle-1-'));
  const dir2 = await mkdtemp(path.join(os.tmpdir(), 'check-content-bundle-2-'));
  try {
    const { manifest: m1, dir: outDir1 } = await writeBundle({ outRoot: dir1 });
    const { manifest: m2, dir: outDir2 } = await writeBundle({ outRoot: dir2 });

    const problems = [];
    if (m1.bundleVersion !== m2.bundleVersion) {
      problems.push(
        `bundleVersion differs between two builds of the same content: ${m1.bundleVersion} vs ${m2.bundleVersion}`,
      );
    }

    const names = new Set([...Object.keys(m1.files), ...Object.keys(m2.files)]);
    for (const name of names) {
      const e1 = m1.files[name];
      const e2 = m2.files[name];
      if (!e1 || !e2) {
        problems.push(`"${name}" present in only one of the two builds`);
        continue;
      }
      if (e1.sha256 !== e2.sha256 || e1.bytes !== e2.bytes) {
        problems.push(`"${name}" differs between the two builds (sha256/bytes mismatch)`);
        continue;
      }
      const [b1, b2] = await Promise.all([
        readFile(path.join(outDir1, e1.path)),
        readFile(path.join(outDir2, e2.path)),
      ]);
      if (!b1.equals(b2)) problems.push(`"${name}" file bytes differ between the two builds`);
    }

    if (problems.length) {
      console.error('\n✖ scripts/build-content-bundle.mjs is not deterministic:');
      for (const p of problems) console.error('    ' + p);
      console.error(
        '\nRunning it twice from the same supabase/seed/** content must yield identical\n' +
          'hashes (OS-011 done-when). Fix the non-determinism (e.g. an unstable\n' +
          'iteration order, or content leaking a timestamp outside manifest.generatedAt).\n',
      );
      return 1;
    }
    console.log(`✓ content bundle is deterministic (bundleVersion=${m1.bundleVersion})`);
  } finally {
    await rm(dir1, { recursive: true, force: true });
    await rm(dir2, { recursive: true, force: true });
  }
}

runMain(main, { name: 'check-content-bundle' });
