import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  LEGAL_DRAFT_BANNER,
  LEGAL_STATUS,
  legalEffectiveLine,
  type LegalBlock,
  type LegalDoc,
} from '@/lib/longlive/legal';
import { SiteFooter } from './SiteFooter';

/**
 * The renderer for both legal pages (#800). All copy lives in
 * `lib/longlive/legal.ts`; this file only turns it into semantic markup.
 *
 * A11y contract (the repo runs axe + pa11y, `.github/workflows/a11y.yml`):
 *   - exactly one `<h1>`, and every section heading is an `<h2>` — the block
 *     model has no third tier, so a level can't be skipped;
 *   - one `<main>` landmark, each section labelled by its own heading;
 *   - tables carry a `<caption>` and `scope="col"` headers, and scroll inside
 *     their own container so the page body never scrolls sideways;
 *   - colours come from the era tokens (`--era-*`), never hard-coded, so the
 *     pages inherit the site's contrast rather than inventing their own.
 */

/** Split prose on `[FOUNDERS: …]` blanks so each one renders as a visible flag. */
function withPlaceholders(text: string): ReactNode[] {
  return text.split(/(\[FOUNDERS:[^\]]*\])/g).map((part, i) =>
    part.startsWith('[FOUNDERS:') ? (
      <mark
        key={i}
        className="rounded-sm bg-[color:var(--status-pending)] px-1.5 py-0.5 text-[color:var(--status-pending-ink)]"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'p') {
    return <p className="mt-4 leading-relaxed">{withPlaceholders(block.text)}</p>;
  }

  if (block.kind === 'list') {
    return (
      <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed">
        {block.items.map((item, i) => (
          <li key={i}>{withPlaceholders(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="mb-2 text-left text-xs uppercase tracking-wider text-[color:var(--era-ink-soft)]">
          {block.caption}
        </caption>
        <thead>
          <tr>
            {block.head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className="border-b border-[color:var(--era-line)] py-2 pr-4 align-top font-semibold"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-[color:var(--era-line)] py-3 pr-4 align-top leading-relaxed text-[color:var(--era-ink-soft)]"
                >
                  {withPlaceholders(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  const isDraft = LEGAL_STATUS !== 'approved';

  return (
    <div className="era-shell font-sans">
      <main className="mx-auto w-full max-w-[46rem] px-5 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/"
            className="text-sm text-[color:var(--era-ink-soft)] underline underline-offset-4 hover:text-[color:var(--era-ink)]"
          >
            &larr; Back to Long Live
          </Link>
        </nav>

        {isDraft && (
          <aside
            aria-labelledby="legal-draft-banner"
            className="mb-8 rounded-lg border border-[color:var(--status-pending-ink)] bg-[color:var(--status-pending)] p-4"
          >
            <p
              id="legal-draft-banner"
              className="font-semibold text-[color:var(--status-pending-ink)]"
            >
              {LEGAL_DRAFT_BANNER.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{LEGAL_DRAFT_BANNER.body}</p>
          </aside>
        )}

        <h1 className="font-era text-3xl font-semibold leading-tight">{doc.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--era-ink-soft)]">{legalEffectiveLine()}</p>
        <p className="mt-6 text-lg leading-relaxed">{doc.summary}</p>

        {doc.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="mt-10"
          >
            <h2
              id={`${section.id}-heading`}
              className="font-era text-xl font-semibold leading-snug"
            >
              {section.heading}
            </h2>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
