#!/usr/bin/env node
// Thin IO wrapper around scripts/lib/reddit-rss.mjs's `parseRedditEmail` so
// scripts/community/inbox.py (Python, matching marjorie-inbox.yml's IMAP
// style) can reuse the already-unit-tested (29 cases, P0-3) zero-LLM
// classifier/extractor instead of re-implementing MIME parsing in Python.
//
// Usage: raw email source (headers + body, as read off an IMAP
// `BODY.PEEK[]` fetch) on stdin; prints `parseRedditEmail`'s result as a
// single line of JSON on stdout. No arguments, no flags — every case that
// can vary (subject, kind, links, postIds) already lives inside the
// tested function; this file's only job is stdin -> function -> stdout.
import { parseRedditEmail } from '../lib/reddit-rss.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const raw = await readStdin();
process.stdout.write(JSON.stringify(parseRedditEmail(raw)));
