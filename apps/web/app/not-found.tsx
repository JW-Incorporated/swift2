import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found — Long Live',
  description: 'This page does not exist.',
  alternates: { canonical: null },
  openGraph: { title: 'Page not found — Long Live' },
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="era-shell font-sans">
      <main className="mx-auto w-full max-w-[46rem] px-5 pb-16 pt-8">
        <h1 className="font-era text-3xl font-semibold leading-tight">Page not found</h1>
        <p className="mt-6 text-lg leading-relaxed">
          That page doesn’t exist, or it has moved.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-[color:var(--era-ink)]"
          >
            &larr; Back to Long Live
          </Link>
        </p>
      </main>
    </div>
  );
}
