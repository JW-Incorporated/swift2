#!/usr/bin/env node
// Post Marjorie's brief/delta to Slack via an incoming webhook.
// Deterministic, zero AI. Reads a payload JSON ({subject, body, url}) — the
// same file brief-mailer.yml builds for the email — and posts the FULL brief
// content (not just a link) into the webhook's channel (#all-longlive-hq),
// converting GitHub-flavored markdown to Slack mrkdwn and splitting it into
// Block Kit sections so long briefs render inline. Skips quietly if
// SLACK_WEBHOOK_URL is unset, mirroring the email mailer's behavior.
// Pure helpers are exported for unit tests.

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SECTION_LIMIT = 2900; // Slack section text hard limit is 3000; leave margin
const MAX_BLOCKS = 50;      // Slack per-message block cap

// Marjorie's bodies open with a `cc @sffan15-sys @wjduvall-cmd` line that only
// matters on GitHub (it's how the mailer finds delta comments). In Slack those
// are not real mentions — strip the leading cc line so the post reads clean.
export function stripCcLine(body) {
  return (body || '').replace(/^\s*cc @[^\n]*\n?/, '');
}

export function gfmToMrkdwn(md) {
  const lines = md.split('\n').map((raw) => {
    let line = raw;
    // Headings -> bold line (Slack sections have no heading syntax)
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) return `*${h[2].trim()}*`;
    // Task-list checkboxes -> emoji (Slack has no checkbox syntax)
    line = line.replace(/^(\s*)[-*]\s+\[ \]\s?/, '$1• ☐ ');
    line = line.replace(/^(\s*)[-*]\s+\[[xX]\]\s?/, '$1• ☑ ');
    // Ordinary bullets -> • (ordered lists left as-is)
    line = line.replace(/^(\s*)[-*]\s+/, '$1• ');
    return line;
  });
  let text = lines.join('\n');
  // Bold: **x** / __x__ -> *x*
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
  text = text.replace(/__(.+?)__/g, '*$1*');
  // Links [t](u) -> <u|t>
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<$2|$1>');
  return text;
}

export function chunk(text, limit = SECTION_LIMIT) {
  const chunks = [];
  let cur = '';
  for (let line of text.split('\n')) {
    // A single over-long line: hard-split it so no chunk exceeds the limit.
    while (line.length > limit) {
      if (cur) { chunks.push(cur); cur = ''; }
      chunks.push(line.slice(0, limit));
      line = line.slice(limit);
    }
    if (cur.length + line.length + 1 > limit) {
      chunks.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : ['_(empty brief)_'];
}

export function buildBlocks({ subject, body, url }) {
  const mrkdwn = gfmToMrkdwn(stripCcLine(body));
  const footer = `<${url}|Open on GitHub / tick your boxes> · reply to Marjorie's email or comment on the issue to talk to her · posted by brief-mailer (zero AI)`;
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: (subject || "Founders' Brief").slice(0, 150) } },
  ];
  const pieces = chunk(mrkdwn);
  // Reserve header + footer + a possible truncation notice against the block cap.
  const room = MAX_BLOCKS - 3;
  const shown = pieces.slice(0, room);
  for (const c of shown) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: c } });
  }
  if (pieces.length > shown.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `_…brief truncated for Slack — read the rest on <${url}|GitHub>._` } });
  }
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: footer }] });
  return blocks;
}

async function main() {
  const payloadPath = process.argv[2] || 'payload.json';
  const webhook = (process.env.SLACK_WEBHOOK_URL || '').trim();
  if (!webhook) {
    console.log('SLACK_WEBHOOK_URL secret not set — skipping Slack post (see docs/agents/marjorie.md › Delivery).');
    return;
  }
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
  const body = JSON.stringify({ text: payload.subject, blocks: buildBlocks(payload) });
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Slack post failed: HTTP ${res.status} ${txt}`);
  }
  console.log(`Posted to Slack [${payload.subject}] (${txt})`);
}

// Run only when invoked directly, not when imported by tests.
let invokedDirectly;
try {
  invokedDirectly = Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
} catch {
  invokedDirectly = false;
}
if (invokedDirectly) {
  main().catch((e) => { console.error(e && e.message ? e.message : e); process.exit(1); });
}
