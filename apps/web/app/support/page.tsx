import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/longlive/SiteFooter';
import { LEGAL_FACTS } from '@/lib/longlive/legal';

// The support page both app stores require a URL for (App Store Connect
// "Support URL", Play "Contact details"). Plain, static, indexable. Contact
// goes to the founder-approved role alias in LEGAL_FACTS — never a personal
// inbox — so this page and the legal pages can never disagree about where
// to write. Copy is deliberately short: it answers the questions a store
// reviewer or a stuck fan actually has.

export const metadata: Metadata = {
  title: 'Support — Long Live',
  description: 'How to get help with the Long Live app and website.',
  alternates: { canonical: '/support' },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'The app says it couldn’t load the Vault.',
    a: 'The app needs an internet connection to fetch the timeline. Check that you are online, then close and reopen the app. If it still fails, email us with your device model and the exact message on screen.',
  },
  {
    q: 'How do I turn notifications on or off?',
    a: 'Tap the bell in the app. From there you can switch notifications off entirely, mute a single type, set quiet hours, or open your inbox. You can also revoke the permission in your phone’s system settings at any time.',
  },
  {
    q: 'What data does the app keep, and how do I delete it?',
    a: 'The app has no account and never asks for your name or email. It keeps an anonymous, randomly generated device id so notification preferences can be saved; uninstalling the app discards it. To have the matching server record removed, email us — the Privacy Policy describes exactly what that record holds.',
  },
  {
    q: 'Something on the timeline is wrong.',
    a: 'Tell us. Every entry links to its source, so include the entry title and what you believe is incorrect. Corrections are the fastest way to make Long Live better.',
  },
];

const linkClass = 'underline underline-offset-4 hover:text-[color:var(--era-ink)]';

export default function SupportPage() {
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

        <h1 className="font-era text-3xl font-semibold leading-tight">Support</h1>
        <p className="mt-6 text-lg leading-relaxed">
          Long Live is an independent, fan-made journey through the eras — on the web and as the
          LongLive app for iPhone and Android. It is not affiliated with, endorsed by, sponsored by,
          or connected to Taylor Swift, her management, or her record labels.
        </p>

        <section id="contact" aria-labelledby="contact-heading" className="mt-10">
          <h2 id="contact-heading" className="font-era text-xl font-semibold leading-snug">
            Get in touch
          </h2>
          <p className="mt-4 leading-relaxed">
            Email{' '}
            <a href={`mailto:${LEGAL_FACTS.privacyEmail}`} className={linkClass}>
              {LEGAL_FACTS.privacyEmail}
            </a>{' '}
            for help with the app, questions about your data, or corrections. We are a two-person
            team and read everything; expect a reply within a few days.
          </p>
          <p className="mt-4 leading-relaxed">
            Rights-holder and takedown notices go to{' '}
            <a href={`mailto:${LEGAL_FACTS.legalEmail}`} className={linkClass}>
              {LEGAL_FACTS.legalEmail}
            </a>
            .
          </p>
        </section>

        <section id="faq" aria-labelledby="faq-heading" className="mt-10">
          <h2 id="faq-heading" className="font-era text-xl font-semibold leading-snug">
            Common questions
          </h2>
          <dl className="mt-4 space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold leading-snug">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-[color:var(--era-ink-soft)]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="policies" aria-labelledby="policies-heading" className="mt-10">
          <h2 id="policies-heading" className="font-era text-xl font-semibold leading-snug">
            Policies
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed">
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>{' '}
              — what the website and the app do and do not collect.
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms of Use
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-sm text-[color:var(--era-ink-soft)]">
            {LEGAL_FACTS.siteName} is operated by {LEGAL_FACTS.entity}.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
