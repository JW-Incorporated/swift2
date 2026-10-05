'use client';

import { useEffect, useRef, useState } from 'react';
import { useHost } from '../../../host';
import { useAppState } from '../../store';
import { buildLocation } from './feedback-location';
import {
  FEEDBACK_QUEUED_MESSAGE,
  FEEDBACK_RESTORED_MESSAGE,
  clearDraft,
  isOffline,
  postFeedback,
  readDraft,
  writeDraft,
} from './feedback-outbox';

export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error' | 'queued';

/**
 * Submit + outbox for the feedback panel. The unsent text is persisted to
 * host.storage.local before every send and cleared on success; an offline
 * submit is queued and resent ONCE when `online` fires (a second failure is
 * left for the user — no retry storm); a new mount restores the draft.
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
  const autoRetry = useRef(false);

  async function submit() {
    const message = msg.trim();
    if (!message || status === 'sending') return;
    autoRetry.current = false;
    writeDraft(host, message);
    if (isOffline()) {
      autoRetry.current = true;
      setStatus('queued');
      setErrorMsg(FEEDBACK_QUEUED_MESSAGE);
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await postFeedback(host, { message, location: buildLocation(state, host), hp });
      if (res.ok) {
        clearDraft(host);
        setStatus('sent');
        setMsg('');
        window.setTimeout(() => {
          onSent();
          setStatus('idle');
        }, 1800);
      } else {
        setStatus('error');
        setErrorMsg(res.error);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try again.');
    }
  }

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    const onOnline = () => {
      if (!autoRetry.current) return;
      autoRetry.current = false;
      void submitRef.current();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    const draft = readDraft(host);
    if (!draft) return;
    setMsg(draft);
    setStatus('error');
    setErrorMsg(FEEDBACK_RESTORED_MESSAGE);
  }, []);

  return { status, errorMsg, submit };
}
