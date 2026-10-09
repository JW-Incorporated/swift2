import type { ReactNode } from 'react';
import { DESK_DISCLOSURE, PERSONA_LIST } from '@swift2/experience';
import { HostLink } from './HostLink';

// The meet-the-desk page (copy-desk spec §8): one page, four cards. The
// disclosure framing is the founders' approved option A (issue #478). Static
// and indexable, like SupportPage.

export function DeskPage({ footer }: { footer?: ReactNode }) {
  return (
    <div className="era-shell font-sans">
      <main className="mx-auto w-full max-w-[46rem] px-5 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <HostLink
            href="/"
            className="text-sm text-[color:var(--era-ink-soft)] underline underline-offset-4 hover:text-[color:var(--era-ink)]"
          >
            &larr; Back to Long Live
          </HostLink>
        </nav>

        <h1 className="font-era text-3xl font-semibold leading-tight">Meet the desk</h1>
        <p className="mt-6 text-lg leading-relaxed">{DESK_DISCLOSURE}</p>

        <ul className="mt-10 space-y-6">
          {PERSONA_LIST.map((p) => (
            <li
              key={p.slug}
              id={p.slug}
              className="scroll-mt-6 rounded-lg border border-[color:var(--era-line)] p-5"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-lg font-semibold text-[color:var(--era-bg)]"
                >
                  {p.mark}
                </span>
                <h2 className="font-era text-xl font-semibold leading-snug">{p.name}</h2>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
                {p.beat}
              </p>
              <p className="mt-3 leading-relaxed">{p.bio}</p>
            </li>
          ))}
        </ul>
      </main>
      {footer}
    </div>
  );
}
