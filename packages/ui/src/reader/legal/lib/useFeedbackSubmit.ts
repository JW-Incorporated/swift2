'use client';

import { useEffect, useRef, useState } from 'react';
import { useHost } from '../../../host';
import { useAppState } from '../../store';
import { buildLocation } from './feedback-location';
import { flushQueue, type FlushResult } from './feedback-flush';
import {
  FEEDBACK_QUEUED_MESSAGE,
  FEEDBACK_QUEUE_FULL_MESSAGE,
  FEEDBACK_RESTORED_MESSAGE,
  clearDraft,
  enqueue,
  readDraft,
  readQueue,
  writeDraft,
} from './feedback-outbox';

export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error' | 'queued';

const DRAFT_DEBOUNCE_MS = 500;
const SENT_LINGER_MS = 1800;

/**
 * Submit + outbox for the feedback panel (all local state on the host storage
 * abstraction, bounded — see feedback-outbox.ts).
 *  - The draft persists on edit (debounced), clears when empty or after a send.
 *  - Send is attempt-first; `navigator.onLine` is never trusted to skip it.
 *  - A transport failure queues the report (stable idempotency id) and arms ONE
 *    resend on `online`; HTTP errors (429/4xx/5xx) are shown, never queued.
 *  - Single-flight per mount (in-flight guard); the item leaves storage
 *    only after a 2xx.
 *  - A new mount restores the draft and any queued reports.
 */
export function useFeedbackSubmit({
  msg,
  setMsg,
  hp,
  onSent,
}: {
  msg: string;
  setMsg: (m: string) => void;
  hp: string;
  onSent: () => void;
}) {
  const state = useAppState();
  const host = useHost();
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inFlight = useRef(false);
  const autoRetry = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const msgRef = useRef(msg);
  msgRef.current = msg;
  const lastPersisted = useRef('');
  const live = useRef({ state, host, hp });
  live.current = { state, host, hp };

  function flush(): Promise<FlushResult> {
    const { state: s, host: h, hp: p } = live.current;
    return flushQueue(h, inFlight, () => ({ location: buildLocation(s, h), hp: p }));
  }

  function showSent() {
    setStatus('sent');
    window.setTimeout(() => {
      onSent();
      setStatus('idle');
    }, SENT_LINGER_MS);
  }

  function showFailure(res: FlushResult) {
    if (res.http) {
      // The text goes back to the box so it can be edited and resent.
      if (!msgRef.current.trim()) setMsg(res.http.item.message);
      setStatus('error');
      setErrorMsg(res.http.error);
    } else if (res.transport || res.busy) {
      setStatus('queued');
      setErrorMsg(FEEDBACK_QUEUED_MESSAGE);
    }
  }

  async function submit() {
    const message = msg.trim();
    if (!message || status === 'sending') return;
    autoRetry.current = false;
    const item = enqueue(host, message);
    if (!item) {
      setStatus('error');
      setErrorMsg(FEEDBACK_QUEUE_FULL_MESSAGE);
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    const res = await flush();
    if (res.sent.includes(item.id)) {
      clearDraft(host);
      lastPersisted.current = '';
      setMsg('');
      showSent();
    } else if (res.http) {
      showFailure(res);
    } else {
      // Queued: the saved copy owns the text now, so a second Send can't
      // create a duplicate.
      autoRetry.current = res.transport;
      clearDraft(host);
      lastPersisted.current = '';
      setMsg('');
      showFailure(res);
    }
  }

  async function retryQueued() {
    autoRetry.current = false;
    const before = readQueue(host);
    const res = await flush();
    // A queued report that was also the draft in the box is now filed: drop the copy.
    const draft = readDraft(host);
    if (draft && before.some((i) => res.sent.includes(i.id) && i.message === draft)) {
      clearDraft(host);
      lastPersisted.current = '';
      setMsg('');
    }
    if (res.sent.length && !readQueue(host).length && statusRef.current === 'queued') showSent();
    else if (res.http || res.transport) showFailure(res);
  }
  const retryRef = useRef(retryQueued);
  retryRef.current = retryQueued;

  useEffect(() => {
    const onOnline = () => {
      if (autoRetry.current) void retryRef.current();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Restore on mount: the unsent draft, plus anything still queued (one
  // attempt per mount, then it is left for the user).
  useEffect(() => {
    const draft = readDraft(host);
    if (draft) {
      lastPersisted.current = draft;
      setMsg(draft);
      setStatus('error');
      setErrorMsg(FEEDBACK_RESTORED_MESSAGE);
    }
    if (readQueue(host).length) {
      setStatus('queued');
      setErrorMsg(FEEDBACK_QUEUED_MESSAGE);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) autoRetry.current = true;
      else void retryRef.current();
    }
  }, []);

  // Persist the draft on edit (debounced); an empty box clears it.
  useEffect(() => {
    if (msg === lastPersisted.current) return;
    const t = window.setTimeout(() => {
      writeDraft(host, msg);
      lastPersisted.current = msg;
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [msg, host]);

  // Flush an in-progress edit on unmount (never clears: an empty box is the
  // debounce's job, so a Strict Mode remount can't wipe a draft).
  useEffect(
    () => () => {
      const text = msgRef.current;
      if (text.trim() && text !== lastPersisted.current) writeDraft(live.current.host, text);
    },
    [],
  );

  return { status, errorMsg, submit };
}
