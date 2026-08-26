#!/usr/bin/env node
// Emergency manual cleanup: deletes a live Facebook Page post by its
// Graph API post ID. Not part of the automated pipeline and never runs on
// a schedule — invoked by hand (workflow_dispatch) when a real duplicate
// post needs removing, e.g. the 2026-07-17 stuck-state-commit incident
// (docs/agents/growth.md). Takes IDs from MEDIA_IDS (comma-separated) and
// the token from IG_ACCESS_TOKEN, same secret the poster already uses.
//
// Facebook Page posts only. Confirmed 2026-07-17: Instagram's Content
// Publishing API has no delete operation for published media at all —
// the Graph API rejects it (code 100 / error_subcode 33, "does not
// support this operation") regardless of token permissions. A duplicate
// Instagram post can only be removed manually, in the Instagram app.

const GRAPH_VERSION = 'v25.0';

const idsArg = process.env.MEDIA_IDS ?? '';
const ids = idsArg.split(',').map((s) => s.trim()).filter(Boolean);
const accessToken = process.env.IG_ACCESS_TOKEN;

if (!ids.length) {
  console.error('No MEDIA_IDS provided.');
  process.exit(1);
}
if (!accessToken) {
  console.error('IG_ACCESS_TOKEN is not set.');
  process.exit(1);
}

let hadError = false;
for (const id of ids) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    hadError = true;
    console.error(`Delete failed for ${id} (${res.status}): ${JSON.stringify(body)}`);
  } else {
    console.log(`Deleted ${id}: ${JSON.stringify(body)}`);
  }
}
if (hadError) process.exit(1);
