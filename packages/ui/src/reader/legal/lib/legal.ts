/**
 * Long Live — legal surface (privacy policy + terms of use). Issue #800, the
 * LEGAL launch gate.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️  DRAFT. NOT LEGAL ADVICE. NOT COUNSEL-APPROVED.
 * ─────────────────────────────────────────────────────────────────────────
 * This copy was drafted by an AI agent from a read of the shipped code. It is
 * a drafting aid to make an engagement with qualified counsel cheap — it is
 * NOT a substitute for that review. Nothing here has been reviewed by a
 * lawyer. Do not treat these pages as approved policy until `LEGAL_STATUS`
 * below is flipped to `'approved'` with a `docs/decisions.md` entry linking
 * counsel's sign-off (the rule `docs/launch-readiness.md` sets for every gate:
 * a colour change is claimable only with a link).
 *
 * WHY THE COPY LIVES HERE AND NOT IN JSX. Three reasons, all load-bearing:
 *   1. It is testable. `legal.test.ts` asserts the invariants that matter
 *      (every unanswered question is a tracked placeholder; an `approved`
 *      document cannot contain one; heading structure can't jump a level).
 *   2. The founders have ONE file to edit — `LEGAL_FACTS` below — rather than
 *      hunting blanks across two pages of markup.
 *   3. The factual sections are a description of what the code actually does.
 *      Keeping them next to `lib/longlive/**` means the next person changing
 *      a data path sees them. **If you add or change ANY data collection,
 *      update `PRIVACY_POLICY` in the same change** — the same standing rule
 *      the old privacy page carried, and which was missed twice (the feedback
 *      button and the mood chat both shipped while the page still said "we
 *      collect nothing").
 *
 * Source inventory behind the factual claims (verified 2026-08-11; Clownbot
 * row added 2026-08-24, issue #3251 — the mood-chat/feedback/analytics/
 * on-device/content rows above were not re-verified in that pass):
 *   - feedback:  apps/web/components/longlive/FeedbackButton.tsx
 *                apps/web/app/api/feedback/route.ts
 *   - mood chat: apps/web/components/longlive/MoodChat.tsx
 *                apps/web/app/api/mood/route.ts
 *                apps/web/lib/longlive/mood-client.ts
 *   - analytics: apps/web/app/layout.tsx (`<Analytics />`, @vercel/analytics);
 *                website only — the mobile apps include no analytics SDK
 *                (see the apps/mobile/package.json line below)
 *   - on-device: packages/experience/src/progress.ts (`ll-progress-v1`,
 *                persisted on web via apps/web/lib/longlive/local-storage-adapter.ts)
 *                apps/web/components/longlive/TimelineScrubber.tsx
 *   - content:   supabase/migrations/** (14 editorial tables, zero personal)
 *   - Clownbot:  apps/web/components/longlive/ClownChat.tsx
 *                apps/web/app/api/clown/route.ts
 *                apps/web/lib/longlive/clown-client.ts (Anthropic call, model)
 *                apps/web/lib/longlive/clown-route-helpers.ts (IP rate limit)
 *                apps/web/lib/longlive/clown-session.ts (anon identity, cookie)
 *                apps/web/lib/longlive/clown-memory.ts (Supabase writes, 180-day
 *                retention, rolling-summary fold)
 *                PLAN.md Stage 11 (feature spec); docs/decisions.md 2026-08-23
 *                item 6 (the 180-day retention figure)
 *   - Android app (verified 2026-08-30, ahead of the Google Play release):
 *                apps/mobile/app.json (name "LongLive", package
 *                ai.jwlabs.longlive, no `android.permissions` declared)
 *                apps/mobile/App.tsx (the only data call is one loadSkeleton()
 *                on mount; no TextInput anywhere in apps/mobile)
 *                apps/mobile/lib/vault.ts → packages/core/src/vault.ts
 *                (three anon SELECTs — era, milestone, month_item — and
 *                `auth: { persistSession: false, autoRefreshToken: false }`)
 *                apps/mobile/package.json (runtime deps are Expo, React
 *                Native, gesture-handler, reanimated, url-polyfill and the
 *                workspace packages — no ad, analytics, or crash SDK)
 */

export { LEGAL_STATUS, LEGAL_FACTS } from './legal-types';
export type { LegalBlock, LegalSection, LegalDoc } from './legal-types';
export { PRIVACY_POLICY } from './legal-privacy';
export { TERMS_OF_USE } from './legal-terms';

/** Footer links to the legal pages. Kept here so the pages can never be orphaned. */
export { LEGAL_LINKS } from './legal-links';

export {
  LEGAL_DOCS,
  legalPlaceholders,
  hasPlaceholder,
  legalRobots,
  legalSitemapEntries,
  legalEffectiveLine,
  LEGAL_DRAFT_BANNER,
} from './legal-helpers';
