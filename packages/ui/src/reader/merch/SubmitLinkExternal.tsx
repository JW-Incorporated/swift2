'use client';

/**
 * The app host's "Submit a link" entry (`HostAdapter.submitLink === 'external'`). The inline form needs a
 * Cloudflare Turnstile token and the app's null-origin WebView cannot mint one, so the server would reject every
 * submission fail-closed. This opens the website's own form (`/?mode=<section>`, the section the share link also
 * targets) in the external browser through the host's validated `openExternal` instead.
 */

import { useHost } from '../../host/context';

export interface SubmitLinkExternalProps {
  section: 'community' | 'merch';
  heading: string;
}

export function SubmitLinkExternal({ section, heading }: SubmitLinkExternalProps) {
  const { env, openExternal } = useHost();
  const href = `${env.origin}/?mode=${section}`;
  return (
    <section className="mt-10 rounded-2xl border border-dashed border-[color:var(--era-line)] bg-[color:var(--era-surface)]/50 p-5">
      <h2 className="font-[family-name:var(--era-font)] text-lg font-semibold text-[color:var(--era-ink)]">{heading}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--era-ink-soft)]">
        Submissions open on longlivets.com — a human reviews every one before it appears; nothing you send goes live automatically.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          if (!openExternal) return;
          event.preventDefault();
          openExternal(href);
        }}
        className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[color:var(--era-accent)] bg-transparent px-5 text-sm font-medium text-[color:var(--era-accent)] transition-colors hover:bg-[color:var(--era-accent)]/10"
      >
        Submit on longlivets.com <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
