// Static privacy policy — required as a hosted URL by both app stores.
// Content must stay truthful to what the apps ACTUALLY do (anonymous public
// reads via Supabase, no accounts, no analytics). If any data collection is
// ever added (analytics, crash reporting, accounts), update this page AND the
// store data-safety forms in the same change
// (see apps/mobile/docs/privacy-and-data-safety.md).
import type { CSSProperties } from 'react';

export const metadata = {
  title: 'Privacy Policy — Swift2 Vault',
  description: 'Privacy policy for the Swift2 Vault web and mobile apps.',
};

const page: CSSProperties = {
  margin: '0 auto',
  maxWidth: 720,
  padding: '48px 24px 96px',
  lineHeight: 1.6,
};
const h1: CSSProperties = { fontSize: 28, marginBottom: 4 };
const meta: CSSProperties = { color: 'var(--ink-soft)', marginTop: 0 };
const h2: CSSProperties = { fontSize: 20, marginTop: 36 };
const soft: CSSProperties = { color: 'var(--ink-soft)' };

export default function PrivacyPage() {
  return (
    <main style={page}>
      <h1 style={h1}>Privacy Policy</h1>
      <p style={meta}>Swift2 Vault — web and mobile apps. Effective July 8, 2026.</p>

      <p>
        The short version: <strong>the Vault does not collect personal data.</strong> There are no
        accounts, no sign-in, no analytics, no ads, and no tracking. The app is a read-only guide
        you browse anonymously.
      </p>

      <h2 style={h2}>What the app does</h2>
      <p>
        The Vault is a read-only timeline of Taylor Swift&rsquo;s eras. When you open it, the app
        fetches its published content (era, milestone, and month entries) from our content database
        (hosted on Supabase) over HTTPS. That request is anonymous — it carries no account, name,
        email, or identifier tied to you.
      </p>

      <h2 style={h2}>What we collect</h2>
      <p>
        <strong>Nothing.</strong> We do not ask for or store your name, email, contacts, location,
        photos, or any other personal information. The mobile app requests no device permissions. We
        use no analytics, advertising, or crash-reporting SDKs.
      </p>

      <h2 style={h2}>Server logs</h2>
      <p>
        Like nearly every internet service, the infrastructure that serves the app (Vercel for the
        website, Supabase for content data) may keep short-lived technical logs — such as IP
        address, request time, and user agent — for security and reliability. These logs are
        operational, are not used to identify or profile you, and are retained only per those
        providers&rsquo; standard policies. We do not combine them with anything else (there is
        nothing to combine them with).
      </p>

      <h2 style={h2}>Third parties</h2>
      <p>
        We do not sell, share, or transfer any user data to third parties — we have none to share.
        External links in the app (sources, articles, videos) lead to sites governed by their own
        privacy policies.
      </p>

      <h2 style={h2}>Children</h2>
      <p>
        The app collects no data from anyone, including children. There is no messaging, no
        user-generated content, and no purchases.
      </p>

      <h2 style={h2}>Changes</h2>
      <p>
        If the app ever starts collecting anything (for example, optional analytics or accounts), we
        will update this policy first and reflect it in the app stores&rsquo; data-safety
        disclosures before shipping the change.
      </p>

      <h2 style={h2}>Contact</h2>
      <p>
        Questions about this policy:{' '}
        <a href="mailto:wjduvall@gmail.com" style={{ color: 'var(--accent)' }}>
          wjduvall@gmail.com
        </a>
        .
      </p>

      <p style={soft}>
        Swift2 Vault is an independent, unofficial fan project. It is not affiliated with, endorsed
        by, sponsored by, or officially connected to Taylor Swift, her management, or her record
        labels.
      </p>
    </main>
  );
}
