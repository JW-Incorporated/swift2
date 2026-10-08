#!/usr/bin/env node
// Vision quality gate for auto-sourced social photos (founder decision "QC
// sonnet", 2026-10-07; cost model in docs/decisions.md). One Claude Sonnet 5.5
// call per candidate decides whether the image is an awesome, usable photo of
// Taylor Swift for a fan app's social posts. Fail-closed everywhere: a missing
// key, API error, refusal or unparsable answer means NOT keep. The model is
// told never to identify anyone from facial features, so it judges composition,
// photo type, quality, overlays and consistency with the caption only.
//
// CLI (manual spot check, one paid call):
//   node scripts/social/photo-qc.mjs <image> [--caption "..."] [--kind wikimedia] [--source host]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { isMain } from '../lib/is-main.mjs';

export const QC_MODEL = 'claude-sonnet-5-5';
export const QC_EDGE_PX = 768;
export const DEFAULT_MAX_CHECKS = 200;
export const DEFAULT_CONCURRENCY = 4;
const PRICE_PER_M_INPUT = 2;
const PRICE_PER_M_OUTPUT = 10;
const MAX_RETRIES = 2;
const BOOLEAN_CHECKS = [
  'main_subject_is_single_prominent_person',
  'consistent_with_caption',
  'is_real_photograph',
  'has_watermark_or_logo_overlay',
  'sharp_and_well_lit',
  'subject_fills_frame_enough',
  'keep',
];

export const QC_SCHEMA = {
  type: 'object',
  properties: {
    main_subject_is_single_prominent_person: { type: 'boolean' },
    consistent_with_caption: { type: 'boolean' },
    is_real_photograph: { type: 'boolean' },
    has_watermark_or_logo_overlay: { type: 'boolean' },
    sharp_and_well_lit: { type: 'boolean' },
    subject_fills_frame_enough: { type: 'boolean' },
    keep: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: [...BOOLEAN_CHECKS, 'reason'],
  additionalProperties: false,
};

export const QC_SYSTEM_PROMPT = `Photo editor for a Taylor Swift fan app's social posts: is this candidate a good photo to post?

Never identify anyone from facial features. Judge only composition, photo type, quality, overlays, and whether the image plausibly shows what the caption claims (the caption says who is pictured).

Stylized or artistic official music-video stills, editorial portraits and concert close-ups are GOOD when one person is clearly the main subject and it fits the caption.

Reject only: crowd, venue or stage panoramas where the subject is small; other people dominant; objects, buildings or text; cover art, posters, graphics, or screenshots of a UI or TV broadcast; a watermark, agency logo or large sponsor wall; blurry, dark or back-view shots.

Checks: main_subject_is_single_prominent_person; consistent_with_caption; is_real_photograph (not art/poster/graphic/screenshot); has_watermark_or_logo_overlay (true = bad); sharp_and_well_lit; subject_fills_frame_enough (not a speck); keep (true only if all positive checks pass and no watermark); reason (max 80 chars).`;

export function kindFromId(id) {
  const s = String(id ?? '');
  if (s.startsWith('official-video')) return 'video-frame';
  if (s.startsWith('wikimedia')) return 'wikimedia';
  if (s.startsWith('openverse')) return 'openverse';
  if (s.startsWith('reddit')) return 'reddit';
  return 'press';
}

export function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export function estimateCost({ inputTokens, outputTokens }) {
  return (inputTokens * PRICE_PER_M_INPUT + outputTokens * PRICE_PER_M_OUTPUT) / 1_000_000;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const notKeep = (reason, extra = {}) => ({
  keep: false,
  reason,
  usage: { inputTokens: 0, outputTokens: 0 },
  ...extra,
});

function parseVerdict(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of BOOLEAN_CHECKS) if (typeof parsed[key] !== 'boolean') return null;
  if (typeof parsed.reason !== 'string') return null;
  return parsed;
}

/**
 * One QC call. Never throws. Returns { keep, reason, checks?, usage, error? }.
 * `error` is set when the result says nothing about the photo itself (API
 * failure, bad key, unparsable answer), so callers can retry it tomorrow
 * instead of recording it as a rejection.
 */
export async function qcPhoto(
  { buffer, caption, source, kind },
  { client, sleepImpl = sleep } = {},
) {
  if (!client) return notKeep('qc-error: no client', { error: true });
  let jpeg;
  try {
    jpeg = await sharp(buffer)
      .resize(QC_EDGE_PX, QC_EDGE_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return notKeep('qc-error: unreadable image', { error: true });
  }
  const request = {
    model: QC_MODEL,
    max_tokens: 800,
    thinking: { type: 'between_tools' },
    system: QC_SYSTEM_PROMPT,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: QC_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') },
          },
          {
            type: 'text',
            text: `Caption: ${caption ?? '(none)'}\nSource host: ${source ?? '(unknown)'}\nKind: ${kind ?? 'unknown'}`,
          },
        ],
      },
    ],
  };
  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await client.messages.create(request);
      break;
    } catch (err) {
      const status = err?.status;
      const retryable =
        status === 429 ||
        (typeof status === 'number' && status >= 500) ||
        (status === undefined && err?.name === 'APIConnectionError');
      if (!retryable || attempt >= MAX_RETRIES) {
        return notKeep(`qc-error: ${status ?? err?.name ?? 'request failed'}`, { error: true });
      }
      await sleepImpl(1000 * 2 ** attempt);
    }
  }
  const usage = {
    inputTokens: response?.usage?.input_tokens ?? 0,
    outputTokens: response?.usage?.output_tokens ?? 0,
  };
  if (response?.stop_reason === 'refusal')
    return { keep: false, reason: 'qc-refusal', usage, refusal: true };
  if (response?.stop_reason !== 'end_turn')
    return {
      keep: false,
      reason: 'qc-error: stop_reason ' + response?.stop_reason,
      usage,
      error: true,
      maxTokens: response?.stop_reason === 'max_tokens',
    };
  const textBlock = (response.content ?? []).find((block) => block?.type === 'text');
  const verdict = parseVerdict(textBlock?.text ?? '');
  if (!verdict) return { keep: false, reason: 'qc-error: unparsable verdict', usage, error: true };
  const keep =
    verdict.keep &&
    !verdict.has_watermark_or_logo_overlay &&
    BOOLEAN_CHECKS.filter((k) => k !== 'has_watermark_or_logo_overlay' && k !== 'keep').every(
      (k) => verdict[k],
    );
  return { keep, reason: verdict.reason.slice(0, 120), checks: verdict, usage };
}

/**
 * Run-level wrapper: client creation, the per-run check cap, bounded
 * concurrency, token totals and the missing-key fail-closed path.
 * `check()` resolves to { status: 'kept' | 'rejected' | 'held' | 'deferred', ... }.
 */
export function createQcSession({
  client,
  env = process.env,
  maxChecks,
  concurrency = DEFAULT_CONCURRENCY,
  warn = (m) => console.log(`::warning::${m}`),
  sleepImpl,
} = {}) {
  const cap = Number.isFinite(maxChecks)
    ? maxChecks
    : Number(env.QC_MAX_CHECKS_PER_RUN) > 0
      ? Number(env.QC_MAX_CHECKS_PER_RUN)
      : DEFAULT_MAX_CHECKS;
  const apiClient =
    client ??
    (env.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0 })
      : null);
  const totals = {
    checks: 0,
    kept: 0,
    rejected: 0,
    held: 0,
    deferred: 0,
    maxTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    failures: {},
  };
  let warnedNoKey = false;
  let active = 0;
  const waiting = [];
  const acquire = async () => {
    if (active >= concurrency) await new Promise((resolve) => waiting.push(resolve));
    active++;
  };
  const release = () => {
    active--;
    waiting.shift()?.();
  };

  async function check(input) {
    if (!apiClient) {
      if (!warnedNoKey) {
        warnedNoKey = true;
        warn(
          'ANTHROPIC_API_KEY is not set — photo QC cannot run, so every new candidate is held out of the library (fail-closed).',
        );
      }
      totals.held++;
      return { status: 'held', reason: 'qc-no-key' };
    }
    if (totals.checks >= cap) {
      totals.deferred++;
      return { status: 'deferred', reason: 'qc-cap' };
    }
    totals.checks++;
    await acquire();
    let result;
    try {
      result = await qcPhoto(input, { client: apiClient, sleepImpl });
    } catch {
      result = notKeep('qc-error: unexpected', { error: true });
    } finally {
      release();
    }
    totals.inputTokens += result.usage.inputTokens;
    totals.outputTokens += result.usage.outputTokens;
    if (result.keep) {
      totals.kept++;
      return { status: 'kept', ...result };
    }
    if (result.error) {
      if (result.maxTokens) totals.maxTokens++;
      totals.held++;
      return { status: 'held', ...result };
    }
    totals.rejected++;
    const failing = result.refusal
      ? ['refusal']
      : Object.entries(result.checks ?? {})
          .filter(
            ([k, v]) =>
              k !== 'keep' &&
              typeof v === 'boolean' &&
              v === (k === 'has_watermark_or_logo_overlay'),
          )
          .map(([k]) => k);
    for (const key of failing.length ? failing : ['keep'])
      totals.failures[key] = (totals.failures[key] ?? 0) + 1;
    return { status: 'rejected', ...result };
  }

  function summary() {
    const cost = estimateCost(totals);
    const failures =
      Object.entries(totals.failures)
        .map(([k, n]) => `${k}=${n}`)
        .join(', ') || 'none';
    return (
      `photo QC: ${totals.checks} checked (${totals.kept} kept, ${totals.rejected} rejected, ${totals.held} held on error/no key, ${totals.maxTokens} of them stopped at max_tokens), ` +
      `${totals.deferred} deferred over the ${cap}-check cap; ${totals.inputTokens} in / ${totals.outputTokens} out tokens, ~$${cost.toFixed(3)}; failing checks: ${failures}`
    );
  }

  return { check, summary, totals };
}

if (isMain(import.meta.url, process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const file = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!file)
    throw new Error(
      'Usage: node scripts/social/photo-qc.mjs <image> [--caption "..."] [--kind kind] [--source host]',
    );
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set.');
  const client = new Anthropic({ maxRetries: 0 });
  const result = await qcPhoto(
    {
      buffer: await readFile(file),
      caption: flag('--caption') ?? 'Taylor Swift performing',
      source: flag('--source'),
      kind: flag('--kind') ?? kindFromId(path.basename(file)),
    },
    { client },
  );
  console.log(
    JSON.stringify(
      { ...result, estimatedUsd: Number(estimateCost(result.usage).toFixed(5)) },
      null,
      2,
    ),
  );
}
