// OS-012 tests: scripts/publish-content-bundle-to-storage.mjs mirrors an
// already-published local bundle to Supabase Storage. Fakes the Supabase
// client (same pattern as scripts/knowledge-fb-upload.test.ts) — no network.
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { publishBundle } from './publish-content-bundle.mjs';
import { BUCKET, ensureBucket, mirrorBundle } from './publish-content-bundle-to-storage.mjs';

function fakeSupabase({ existingBuckets = [], failOnPath = null } = {}) {
  const uploadCalls = [];
  return {
    storage: {
      listBuckets: async () => ({ data: existingBuckets.map((name) => ({ name })), error: null }),
      createBucket: async () => ({ error: null }),
      from: () => ({
        upload: async (storagePath, contents, opts) => {
          uploadCalls.push({ storagePath, contents, opts });
          if (failOnPath && storagePath === failOnPath) {
            return { error: { message: 'simulated upload failure' } };
          }
          return { error: null };
        },
      }),
    },
    __uploadCalls: uploadCalls,
  };
}

describe('ensureBucket', () => {
  it('creates the public "content" bucket when it does not exist yet', async () => {
    const supabase = fakeSupabase({ existingBuckets: [] });
    const created = await ensureBucket(supabase);
    expect(created).toBe(true);
  });

  it('is idempotent — does nothing when the bucket already exists', async () => {
    const supabase = fakeSupabase({ existingBuckets: [BUCKET] });
    const created = await ensureBucket(supabase);
    expect(created).toBe(false);
  });
});

describe('mirrorBundle', () => {
  let dir;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('uploads every manifest file plus manifest.json under <bundleVersion>/, then current.json last', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'mirror-content-bundle-'));
    const { manifest } = await publishBundle({ outRoot: dir, resync: false });
    const supabase = fakeSupabase();

    const result = await mirrorBundle(supabase, dir, manifest.bundleVersion);

    expect(result.bundleVersion).toBe(manifest.bundleVersion);
    // +1 for manifest.json itself, which is not a manifest.files entry.
    expect(result.filesUploaded).toBe(Object.keys(manifest.files).length + 1);

    const paths = supabase.__uploadCalls.map((c) => c.storagePath);
    expect(paths[paths.length - 1]).toBe('current.json');
    expect(paths).toContain(`${manifest.bundleVersion}/manifest.json`);
    expect(paths).toContain(`${manifest.bundleVersion}/eras.json`);

    // Every versioned file uploaded before current.json, with an immutable
    // cache-control; current.json gets the short-TTL one.
    for (const call of supabase.__uploadCalls) {
      if (call.storagePath === 'current.json') {
        expect(call.opts.cacheControl).toBe('60');
      } else {
        expect(call.opts.cacheControl).toBe('31536000');
      }
    }
  }, 60_000);

  it('never uploads current.json when an earlier file upload fails', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'mirror-content-bundle-fail-'));
    const { manifest } = await publishBundle({ outRoot: dir, resync: false });
    const failPath = `${manifest.bundleVersion}/eras.json`;
    const supabase = fakeSupabase({ failOnPath: failPath });

    await expect(mirrorBundle(supabase, dir, manifest.bundleVersion)).rejects.toThrow(/eras\.json/);

    const paths = supabase.__uploadCalls.map((c) => c.storagePath);
    expect(paths).not.toContain('current.json');
  }, 60_000);
});
