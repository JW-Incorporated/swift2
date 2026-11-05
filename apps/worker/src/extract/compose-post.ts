// Two-pass writer orchestration for one published candidate (docs/decisions.md
// 2026-11-03): writer -> deterministic writing gate -> judge, with exactly one
// rewrite across all three steps. Any deferral or second failure is a hold; the
// pass-A summary/detail text is never a fallback.

import { evaluateCurrentItemWriting, factGrounding } from '@swift2/shared';
import type { ContextPack } from './context-pack';
import { JUDGE_DIMENSIONS, JUDGE_MIN_SCORES, type JudgeDimension } from './judge-prompt';
import { judgeWriting } from './judge-client';
import type { ExtractedFact } from './types';
import type { ExtractUsageStore } from './usage-store';
import { writePost, type WriterCitation, type WriterParagraph } from './writer-client';

export interface ComposeInput {
  headline: string;
  /** ISO date the story was observed; the judge reads relative dates against it. */
  observedOn: string;
  statusHint: string;
  facts: readonly ExtractedFact[];
  context: ContextPack;
  sources: readonly { outletName: string; url: string }[];
  /** Tuning harness only: override the writer model. */
  writerModel?: string;
}

/** What the last attempt produced, for the shadow-mode report. */
export interface ComposeTrace {
  lead?: string;
  body?: string;
  citations?: WriterCitation[];
  paragraphs?: WriterParagraph[];
  gateReasons?: string[];
  judgeScores?: Record<JudgeDimension, number>;
  judgeReasons?: Record<JudgeDimension, string>;
  rewrites: number;
}

export type ComposeResult =
  | { status: 'ok'; lead: string; body: string; writingScore: number; trace: ComposeTrace }
  | { status: 'hold'; reason: string; trace: ComposeTrace };

export interface ComposeDeps {
  writer: ExtractUsageStore;
  judge: ExtractUsageStore;
  write?: typeof writePost;
  judgeFn?: typeof judgeWriting;
  /** Tuning harness only: judge a supplied draft once, no rewrite. */
  noRewrite?: boolean;
  /** Tuning harness only: also judge a draft the writing gate rejected; the hold outcome is unchanged. */
  judgeAll?: boolean;
}

function lowestDimension(scores: Record<JudgeDimension, number>): JudgeDimension {
  return JUDGE_DIMENSIONS.reduce((lowest, d) => (scores[d] < scores[lowest] ? d : lowest), JUDGE_DIMENSIONS[0]);
}

export async function composePost(deps: ComposeDeps, input: ComposeInput): Promise<ComposeResult> {
  const write = deps.write ?? writePost;
  const judge = deps.judgeFn ?? judgeWriting;
  let rewriteReasons: string[] | undefined;
  const trace: ComposeTrace = { rewrites: 0 };
  const sources = input.sources.map((s) => ({ name: s.outletName, url: s.url }));
  const { factAttributions, factClaims } = factGrounding(input.facts);
  const factLines = input.facts.map((f) => `[${f.id}] ${f.claim} (${f.attribution}, ${f.confidence})`);

  for (;;) {
    const written = await write(deps.writer, {
      headline: input.headline,
      statusHint: input.statusHint,
      facts: input.facts,
      context: input.context,
      ...(input.writerModel ? { model: input.writerModel } : {}),
      ...(rewriteReasons ? { rewriteReasons } : {}),
    });
    if (written.status === 'deferred') return { status: 'hold', reason: 'writer_deferred', trace };

    let failure: { hold: string; reasons: string[] } | undefined;
    if (written.status === 'invalid') {
      const { lead, body, citations, paragraphs } = written.attempt ?? {};
      Object.assign(trace, { lead, body, citations, paragraphs, gateReasons: written.reasons, judgeScores: undefined, judgeReasons: undefined });
      failure = { hold: 'writing_quality:invalid_draft', reasons: written.reasons };
    } else {
      const { lead, body, citations, paragraphs } = written.draft;
      Object.assign(trace, { lead, body, citations, paragraphs, gateReasons: undefined, judgeScores: undefined, judgeReasons: undefined });
      const gate = evaluateCurrentItemWriting({
        headline: input.headline,
        lead,
        body,
        sources,
        factAttributions,
        factClaims,
        sentenceRefs: paragraphs.flatMap((p) => p.sentences.map((sentence) => sentence.refs)),
      });
      if (!gate.ok) {
        trace.gateReasons = gate.reasons;
        if (deps.judgeAll) {
          const scored = await judge(deps.judge, {
            observedOn: input.observedOn,
            lead,
            body,
            facts: factLines,
            attributions: factAttributions,
            context: input.context.text,
            citations: paragraphs.flatMap((p) => p.sentences),
          });
          if (scored.status !== 'deferred') {
            trace.judgeScores = scored.scores;
            trace.judgeReasons = scored.reasons;
          }
        }
        failure = { hold: `writing_quality:${gate.reasons[0]}`, reasons: gate.reasons };
      } else {
        const verdict = await judge(deps.judge, {
          observedOn: input.observedOn,
          lead,
          body,
          facts: factLines,
          attributions: factAttributions,
          context: input.context.text,
          citations: paragraphs.flatMap((p) => p.sentences),
        });
        if (verdict.status === 'deferred') return { status: 'hold', reason: 'judge_deferred', trace };
        trace.judgeScores = verdict.scores;
        trace.judgeReasons = verdict.reasons;
        if (verdict.pass) return { status: 'ok', lead, body, writingScore: verdict.writingScore, trace };
        const lowest = lowestDimension(verdict.scores);
        failure = {
          hold: `writing_quality:${lowest}`,
          reasons: JUDGE_DIMENSIONS
            .filter((d) => verdict.scores[d] < JUDGE_MIN_SCORES[d])
            .map((d) => `${d} scored ${verdict.scores[d]}/5: ${verdict.reasons[d] || 'no reason given'}`),
        };
      }
    }

    if (rewriteReasons || deps.noRewrite) return { status: 'hold', reason: failure.hold, trace };
    rewriteReasons = failure.reasons;
    trace.rewrites = 1;
  }
}
