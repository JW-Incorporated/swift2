import { readFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';

const DISCORD_MESSAGE_LIMIT = 2_000;
const MAX_ATTEMPTS = 3;

export function neutralizeMentions(text) {
  return String(text)
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&/g, '<@\u200b&');
}

export function splitDiscordContent(body, limit = DISCORD_MESSAGE_LIMIT) {
  const text = neutralizeMentions(body);
  if (!text) return [''];
  const parts = [];
  let offset = 0;
  while (offset < text.length) {
    if (text.length - offset <= limit) {
      parts.push(text.slice(offset));
      break;
    }
    const window = text.slice(offset, offset + limit + 1);
    const boundary = Math.max(
      window.lastIndexOf('\n\n', limit),
      window.lastIndexOf('\n', limit),
      window.lastIndexOf(' ', limit),
    );
    const end = boundary > 0 ? offset + boundary : offset + limit;
    parts.push(text.slice(offset, end));
    offset = end;
  }
  return parts;
}

export function labelDiscordParts(body, limit = DISCORD_MESSAGE_LIMIT) {
  let partCount = 1;
  let parts = splitDiscordContent(body, limit);

  while (parts.length !== partCount) {
    partCount = parts.length;
    const prefixLength = `[Part ${partCount}/${partCount}]\n\n`.length;
    parts = splitDiscordContent(body, limit - prefixLength);
  }

  if (parts.length === 1) return parts;
  return parts.map((part, index) => `[Part ${index + 1}/${parts.length}]\n\n${part}`);
}

export async function postWithRetry(
  webhook,
  init,
  {
    fetchImpl = fetch,
    waitImpl = (waitMs) => new Promise((resolve) => setTimeout(resolve, waitMs)),
  } = {},
) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(webhook, init);
    } catch {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error('DISCORD_DELIVERY_FAILED network error');
      }
      await waitImpl(1_000);
      continue;
    }
    if (response.ok) return;
    if (response.status === 401 || response.status === 404) {
      throw new Error(`DISCORD_WEBHOOK_INVALID HTTP ${response.status}`);
    }
    if (attempt === MAX_ATTEMPTS || (response.status !== 429 && response.status < 500)) {
      throw new Error(`DISCORD_DELIVERY_FAILED HTTP ${response.status}`);
    }
    const retryAfter = Number(response.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : 1_000;
    await waitImpl(waitMs);
  }
}

export async function postDiscordPayload(
  payload,
  { webhook = process.env.DISCORD_BRIEF_WEBHOOK, fetchImpl = fetch, waitImpl } = {},
) {
  if (!webhook) return { status: 'unconfigured' };
  const subject = neutralizeMentions(payload.subject || 'Swift2 update');
  const body = String(payload.body || '');
  const url = payload.url ? `\n\nOpen on GitHub: ${payload.url}` : '';
  const fullBody = `# ${subject}\n\n${body}${url}\n`;
  const chunks = labelDiscordParts(fullBody);
  for (const content of chunks) {
    await postWithRetry(
      webhook,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
      },
      { fetchImpl, waitImpl },
    );
  }
  const form = new FormData();
  form.set(
    'payload_json',
    JSON.stringify({
      content: 'Full brief attached.',
      allowed_mentions: { parse: [] },
    }),
  );
  form.set('files[0]', new Blob([fullBody], { type: 'text/markdown' }), 'founders-brief.md');
  await postWithRetry(webhook, { method: 'POST', body: form }, { fetchImpl, waitImpl });
  return { status: 'delivered', chunks: chunks.length };
}

async function main() {
  const payloadPath = process.argv[2];
  if (!payloadPath) throw new Error('Usage: node scripts/discord/post-brief.mjs <payload.json>');
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
  const result = await postDiscordPayload(payload);
  if (result.status === 'unconfigured') {
    console.log('SKIPPED: DISCORD_BRIEF_WEBHOOK not configured');
    return 0;
  }
  console.log(
    `Delivered [${payload.subject}] to Discord (${result.chunks} message part(s) plus attachment)`,
  );
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'post-brief.mjs') {
  runMain(main, { name: 'post-brief' });
}
