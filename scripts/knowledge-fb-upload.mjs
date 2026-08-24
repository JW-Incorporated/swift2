#!/usr/bin/env node
// Uploads saved Facebook export HTML files to a private Supabase Storage
// bucket and deletes the local copies (proposal §4.7 step 5, PLAN.md Stage
// 6). Raw exports never touch the repo — it is public.
//
//   npm run knowledge:fb-upload -- ~/Downloads/fb-*.html
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (apps/worker/.env) — the
// same service-role write path apps/worker itself uses, because uploading
// to a PRIVATE bucket is a privileged write, not a public read (the pattern
// scripts/sync-longlive-*.mjs use for reads is the anon key on purpose).
//
// Self-provisions the bucket on first run via the service-role key's
// storage.createBucket — checked before assuming this needed a dashboard
// click; it doesn't, a service-role caller can create a bucket directly.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, unlinkSync } from 'node:fs';
import { basename } from 'node:path';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const BUCKET = 'facebook-exports';

/** Creates the bucket if it doesn't exist yet. Idempotent — safe to call every run. */
export async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`could not list storage buckets: ${listError.message}`);
  if ((buckets ?? []).some((b) => b.name === BUCKET)) return false;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (createError) throw new Error(`could not create bucket "${BUCKET}": ${createError.message}`);
  return true;
}

/**
 * Uploads each file, deleting the local copy only on a confirmed successful
 * upload — a failed upload keeps the local file (nothing is ever lost
 * silently). `fsImpl` is injectable for tests.
 */
export async function uploadFiles(supabase, filePaths, fsImpl = { readFileSync, unlinkSync }) {
  const results = [];
  for (const filePath of filePaths) {
    const name = basename(filePath);
    let contents;
    try {
      contents = fsImpl.readFileSync(filePath);
    } catch (err) {
      results.push({ name, ok: false, reason: `could not read: ${err.message}` });
      continue;
    }
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, contents, { contentType: 'text/html', upsert: true });
    if (error) {
      results.push({ name, ok: false, reason: `upload failed: ${error.message}` });
      continue;
    }
    fsImpl.unlinkSync(filePath);
    results.push({ name, ok: true });
  }
  return results;
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('knowledge:fb-upload: usage: npm run knowledge:fb-upload -- <file.html> [more files...]');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'knowledge:fb-upload: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env).',
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const created = await ensureBucket(supabase);
  if (created) console.log(`knowledge:fb-upload: created private bucket "${BUCKET}"`);

  const results = await uploadFiles(supabase, files);
  for (const r of results) {
    console.log(r.ok ? `  ${r.name}: uploaded, local copy deleted` : `  ${r.name}: ${r.reason} — local copy KEPT`);
  }
  const okCount = results.filter((r) => r.ok).length;
  console.log(`knowledge:fb-upload: ${okCount}/${results.length} uploaded`);
  if (okCount < results.length) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error('knowledge:fb-upload: crashed:', err);
    process.exit(1);
  });
}
