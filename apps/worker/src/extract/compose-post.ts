// Two-pass writer orchestration for one published candidate (docs/decisions.md
// 2026-11-03): writer -> deterministic writing gate -> judge, with exactly one
// rewrite across all three steps. Any deferral or second failure is a hold; the
// pass-A summary/detail text is never a fallback.

import { evaluateCurrentItemWriting } from '@swift2/shared';
import type { ContextPack } from './context-pack';
import { JUDGE_DIMENSIONS, JUDGE_PASS_SCORE, type JudgeDimension } from './judge-prompt';
import { judgeWriting } from './judge-client';
import type { ExtractedFact } from './types';
import type { ExtractUsageStore } from './usage-store';
import { writePost, type WriterCitation } from './writer-client';

export interface ComposeInput {
  headline: string;
  statusHint: string;
  facts: readonly ExtractedFact[];
  context: ContextPack;
  sources: readonly { outletName: string; url: string }[];
}

/** What the last attempt produced, for the shadow-mode report. */
export interface ComposeTrace {
  lead?: string;
  body?: string;
  citations?: WriterCitation[];
  gateReasons?: string[];
  judgeScores?: Record<JudgeDimension, number>;
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
  const factLines = input.facts.map((f) => `${f.claim} (${f.attribution}, ${f.confidence})`);

  for (;;) {
    const written = await write(deps.writer, {
      headline: input.headline,
      statusHint: input.statusHint,
      facts: input.facts,
      context: input.context,
      ...(rewriteReasons ? { rewriteReasons } : {}),
    });
    if (written.status === 'deferred') return { status: 'hold', reason: 'writer_deferred', trace };

    let failure: { hold: string; reasons: string[] } | undefined;
    if (written.status === 'invalid') {
      trace.gateReasons = written.reasons;
      failure = { hold: 'writing_quality:invalid_draft', reasons: written.reasons };
    } else {
      const { lead, body, citations } = written.draft;
      Object.assign(trace, { lead, body, citations, gateReasons: undefined, judgeScores: undefined });
      const gate = evaluateCurrentItemWriting({
        headline: input.headline,
        lead,
        body,
        sources,
        citations: citations.map((c) => c.sentence),
      });
      if (!gate.ok) {
        trace.gateReasons = gate.reasons;
        failure = { hold: `writing_quality:${gate.reasons[0]}`, reasons: gate.reasons };
      } else {
        const verdict = await judge(deps.judge, { headline: input.headline, lead, body, facts: factLines });
        if (verdict.status === 'deferred') return { status: 'hold', reason: 'judge_deferred', trace };
        trace.judgeScores = verdict.scores;
        if (verdict.pass) return { status: 'ok', lead, body, writingScore: verdict.writingScore, trace };
        const lowest = lowestDimension(verdict.scores);
        failure = {
          hold: `writing_quality:${lowest}`,
          reasons: JUDGE_DIMENSIONS
            .filter((d) => verdict.scores[d] < JUDGE_PASS_SCORE)
            .map((d) => `${d} scored ${verdict.scores[d]}/5: ${verdict.reasons[d] || 'no reason given'}`),
        };
      }
    }

    if (rewriteReasons) return { status: 'hold', reason: failure.hold, trace };
    rewriteReasons = failure.reasons;
    trace.rewrites = 1;
  }
}
