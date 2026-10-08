'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClownAnswer, InvestigationStep } from '@swift2/shared';
import type { ClownTurn } from '@swift2/shared';
import { flattenAnswer } from './clown-chat-helpers';
import { readClownStream } from './clown-stream';
import { useAppActions, useAppState } from '../../store';
import { useHost } from '../../../host/context';
import { bufferedFrom } from '../../../host/buffered-from';

const NETWORK_ERROR = "That didn't go through. Try again in a moment?";

/**
 * The ClownChat ask loop, split out of ClownChat.tsx (300-line cap): the
 * busy/error/investigating state, the in-flight abort handling and the
 * `/api/clown` fetch + stream reader. `setText` clears the composer on a
 * successful send.
 */
export function useClownAsk(setText: (text: string) => void) {
  const { clownMessages } = useAppState();
  const { addClownMessage } = useAppActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The agent loop's live trail (PLAN.md Stage 10) — reset per ask, cleared
  // once the final answer lands (it is rendered from `message.answer.
  // investigation` after that, not from this transient state).
  const [investigating, setInvestigating] = useState<InvestigationStep | null>(null);

  const host = useHost();
  const inflightRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      const c = inflightRef.current;
      inflightRef.current = null;
      c?.abort();
    },
    [],
  );

  const ask = useCallback(
    async (question: string, options: { chip?: boolean } = {}) => {
      inflightRef.current?.abort();
      const controller = new AbortController();
      inflightRef.current = controller;
      setBusy(true);
      setError(null);
      setInvestigating(null);
      try {
        // PRIOR turns only, from the store's clownMessages — never the
        // question being sent now (the route appends that itself; sending it
        // here too would double it in the model's eyes).
        const transcript: ClownTurn[] = clownMessages.flatMap((m) => [
          { role: 'user' as const, text: m.question },
          { role: 'assistant' as const, text: flattenAnswer(m.answer) },
        ]);
        // `chip` deliberately omitted for every normal ask: that flag routes
        // to the deterministic zero-model fallback (board taps only prefill
        // the composer — once the reader hits send, per the founder's brief
        // it's a normal question and gets the full model treatment). The
        // ONE exception is the fan-theory chip (Community Engine plan
        // §Phase 2, card P2-5, `askFanTheoryChip` in ClownChat.tsx) — it sends
        // immediately with `chip: true`, same as `ClownBoard`'s deterministic
        // taps, because "what are fans theorising right now?" has a real
        // zero-model answer (the `live_theory` knowledge_doc projection) and
        // does not need a model call to be worth answering instantly.
        // Session continuity (architect-directed redesign, HUMAN-ACTIONS.md
        // #15 round 4): the route's server-side identity now round-trips via
        // an `HttpOnly` cookie the browser sends/receives automatically on
        // this same-origin `fetch` — no client-side token capture or storage
        // needed at all.
        const chunks = (host.apiStream ?? bufferedFrom(host.apiFetch))({
          method: 'POST',
          path: '/api/clown',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: question, transcript, ...(options.chip ? { chip: true } : {}) }),
        }, { signal: controller.signal });
        // PLAN.md Stage 10: the route streams the agent loop's investigation
        // trail as it happens, then exactly one final answer event — every
        // deterministic (non-loop) response still arrives as a single event
        // under this same reader, so this replaces the old `res.json()` for
        // every path, not just the loop's.
        let answer: ClownAnswer | null = null;
        await readClownStream(chunks, (event) => {
          if (controller.signal.aborted) throw new DOMException('aborted', 'AbortError');
          if (event.type === 'investigation') setInvestigating(event.step);
          else answer = event.answer;
        });
        if (!answer) throw new Error('no answer event in stream');
        addClownMessage(question, answer);
        if (inflightRef.current === controller) setText('');
      } catch {
        if (inflightRef.current === controller) setError(NETWORK_ERROR);
      } finally {
        if (inflightRef.current === controller) {
          inflightRef.current = null;
          setInvestigating(null);
          setBusy(false);
        }
      }
    },
    [addClownMessage, clownMessages, host],
  );

  return { busy, error, investigating, ask };
}
