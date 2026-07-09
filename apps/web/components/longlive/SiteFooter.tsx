'use client';

import { useAppActions } from '@/lib/longlive/store';

export function SiteFooter() {
  const { openGlossary } = useAppActions();

  return (
    <footer className="border-t border-[color:var(--era-line)] px-5 py-10 pb-28 text-center">
      <p className="font-era text-lg font-semibold">Long Live</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
        An independent, fan-made journey through the eras. Not affiliated with,
        endorsed by, or connected to Taylor Swift or her representatives. All
        narratives are widely-discussed fan interpretations, not confirmed fact.
      </p>
      <button
        type="button"
        onClick={() => openGlossary()}
        className="mt-4 text-xs font-medium text-[color:var(--era-ink-soft)] underline underline-offset-4 transition-colors hover:text-[color:var(--era-ink)]"
      >
        Glossary — what “thread”, “crossing” &amp; “vault” mean here
      </button>
    </footer>
  );
}
