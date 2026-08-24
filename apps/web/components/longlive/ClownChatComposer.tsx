'use client';

/**
 * The clown-bot panel's docked composer — split out of ClownChat.tsx to keep
 * that file under the 300-line cap (see MAP.md). Auto-grows via
 * `useAutoResizeTextarea` (clown-chat-ui.ts), capped so a long multi-line
 * question doesn't blow out the fixed-height panel.
 */

import { CornerDownLeft, Loader2, Plus } from 'lucide-react';
import type { RefObject } from 'react';
import { useAutoResizeTextarea } from '@/lib/longlive/clown-chat-ui';

const MAX_CHARS = 300;
const INPUT_PLACEHOLDER = 'lets clown around';

export function ClownChatComposer({
  expanded,
  text,
  setText,
  submit,
  busy,
  textareaRef,
}: {
  expanded: boolean;
  text: string;
  setText: (next: string) => void;
  submit: (e: React.FormEvent) => void;
  busy: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  useAutoResizeTextarea(textareaRef, text);

  const wrapClassName = `flex-none bg-[color:var(--clown-bg)] px-4 pb-4 pt-3.5 sm:px-6${
    expanded ? ' pb-[max(1rem,env(safe-area-inset-bottom))]' : ''
  }`;

  return (
    <div className={wrapClassName}>
      {/* Plus/send: same 32px-visual / 44px-hit-area split as the titlebar toggle, so the pill keeps the mockup's proportions. */}
      <form
        onSubmit={submit}
        className="flex items-center gap-1.5 rounded-full border border-[color:var(--clown-line)] bg-[color:var(--clown-panel)] py-1 pl-1 pr-1 focus-within:border-[color:var(--era-accent)]"
      >
        <button
          type="button"
          disabled
          aria-label="Add attachment"
          className="relative flex h-8 w-8 flex-none items-center justify-center rounded-full text-[color:var(--clown-ink-soft)] before:absolute before:-inset-1.5 before:content-[''] disabled:cursor-default"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <label htmlFor="clown-input" className="sr-only">
          Ask the clown
        </label>
        <textarea
          id="clown-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder={INPUT_PLACEHOLDER}
          // h-9 is the single-line baseline before useAutoResizeTextarea
          // above runs; max-h keeps that same MAX_TEXTAREA_HEIGHT_PX cap as a
          // CSS backstop if JS is ever slow to attach.
          className="h-9 max-h-[136px] min-w-0 flex-1 resize-none bg-transparent px-0 py-2 text-[15px] leading-relaxed text-[color:var(--clown-ink)] outline-none placeholder:text-[color:var(--clown-ink-soft)] placeholder:opacity-60"
        />
        <button
          type="submit"
          disabled={!text.trim() || busy}
          aria-label="Send to clown bot"
          className={`relative flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--clown-bg)] transition before:absolute before:-inset-1.5 before:content-[''] ${
            text.trim() ? 'opacity-100' : 'opacity-[0.45]'
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CornerDownLeft className="h-4 w-4" aria-hidden />
          )}
        </button>
      </form>
      <p className="mt-2.5 text-center text-[11px] text-[color:var(--clown-ink-soft)] opacity-80">
        clown bot theorises from the vault. It can be wrong &mdash; that&rsquo;s the point.
      </p>
    </div>
  );
}
