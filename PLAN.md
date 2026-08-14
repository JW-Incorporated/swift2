# PLAN.md — Community + Merch sections, with a public submit-a-link form

Branch `feature/community-merch`, cut from `research/communities` (PR #2110)
because the Community dataset is its data source. **#2110 merges first.**

Joey, 2026-08-14: "implement the two new sections of the website live (community
and merch)… add the data we do have, and then at the bottom add a button where
users can submit their own. all they need to do is put a link and hit submit."
Submissions go to a Google Sheet and an email to sffan15@gmail.com. "we will
build out these pages over time with community input vs. trying to find them
all ourselves."

## The constraint that shapes everything

Issue #36's no-go still stands (`docs/definition-of-done.md:206-212`) and
forbids **user-generated content hosting liability**. A public submit form walks
straight into that — *if* what users submit appears on the site.

**So: nothing a user submits ever renders on longlivets.com.** Submissions go
to Joey's inbox, his sheet and a GitHub issue. He curates; the site only ever
shows what he has added by hand. That is also exactly his stated intent
("I'll use this spreadsheet to organize and manually pull info"), so this
costs nothing and keeps a settled decision settled.

## The infrastructure reality, and the design it forces

Surveyed before designing:

| Need | What exists today |
|---|---|
| Runtime email from a Vercel route | **Nothing in Swift2.** Existing mail is Python+Gmail from GitHub Actions — unreachable from a route handler. A portable pattern exists in `Watch Website & IG/api/inquiry.js` (plain fetch to Resend, no SDK). |
| Resend key usable as `@longlivets.com` | **No.** The existing key is verified for `4twatches.com`; Resend verifies per domain. Needs Joey to add the domain. |
| Google Sheets **write** | **Nothing anywhere in the projects tree.** The only Google integration is a read-only Apps Script. |
| Public form with rate-limit + honeypot | **Yes** — `/api/feedback` + `FeedbackButton.tsx`. Reuse this shape. |

Two of three integrations need a founder action I cannot take (verifying a
domain, deploying an Apps Script). **Therefore the route degrades by design:**

1. **GitHub issue — always, needs no new credentials.** Reuses the proven
   `/api/feedback` path. This is the durable record and the day-one behaviour.
2. **Google Sheet — when `SUBMISSIONS_SHEET_WEBHOOK_URL` is set.** An Apps
   Script `doPost` that appends a row. Script written for Joey; he deploys it.
3. **Email — when `RESEND_API_KEY` + `SUBMISSIONS_EMAIL_FROM` are set.**

**A missing integration must never fail the user's submission** and must never
be silent to us: log it, still return success, still write the GitHub issue.

## Files touched

| Path | Change |
|---|---|
| `apps/web/lib/longlive/communities.ts` | **New** — typed community data from `data/communities.json`, plus platform grouping |
| `apps/web/lib/longlive/merch.ts` | **New** — merch catalogue assembled from the existing `shop.ts` products + official store |
| `apps/web/app/api/submit-link/route.ts` | **New** — the submission endpoint |
| `apps/web/lib/longlive/submit-link.ts` | **New** — validation + the three sinks, each independently optional |
| `apps/web/components/longlive/CommunitySection.tsx` | **New** |
| `apps/web/components/longlive/MerchSection.tsx` | **New** |
| `apps/web/components/longlive/SubmitLinkForm.tsx` | **New** — shared by both sections |
| `apps/web/lib/longlive/store.tsx` | Edit — `AppMode` gains `community`, `merch` |
| `apps/web/components/longlive/BottomNav.tsx` | Edit — two tabs (6 total → icon-only, already implemented) |
| `apps/web/components/longlive/TopBar.tsx`, `LongLive.tsx`, `share.ts` | Edit — mode wiring |
| `scripts/apps-script/submissions-doPost.gs` | **New** — the Apps Script for Joey to deploy |
| `docs/ops/community-merch-submissions.md` | **New** — Joey's 3-step setup |
| `docs/decisions.md` | Entry: no-auto-publish, and the degrade-by-design sinks |

## Steps — 1-4 run in parallel

1. [ ] **Data layer** (executor). `communities.ts` from `data/communities.json`
   — carry `verification.status` through; the UI must be able to show a
   confidence signal. `merch.ts` from `shop.ts` + the official store.
   - Verify: `npm test`, typecheck. Report real counts for both.
2. [ ] **Submission endpoint** (executor). Validation, rate limit and honeypot
   copied from `/api/feedback`. Three sinks, each independently optional.
   Plus the Apps Script and Joey's setup doc.
   - Verify: route tests for valid, bad URL, honeypot, over-rate-limit, and
     **each integration missing** — asserting the submission still succeeds.
3. [ ] **UI** (executor). Both sections + the shared form. Chat-app chrome is
   NOT wanted here; these are directory pages in the era palette.
   - Verify: typecheck, lint.
4. [ ] **Nav wiring** (executor). Two new modes end to end. Owns `store.tsx`.
   - Verify: `npm test -- bottom-nav`, typecheck.
5. [ ] Orchestrator: integrate, run the full gate, Fable review, PR, merge.

## Known risks

- **Auto-publish would breach #36.** The single thing not to get wrong.
- **A public endpoint that emails and writes a sheet is a spam amplifier.**
  Rate limit + honeypot are the floor. URL validation must reject non-http(s).
- **Do not leak the Apps Script URL** — it is an unauthenticated write endpoint.
  Env var only, never in client code, never in the repo.
- **`shop.ts` is affiliate-ready** — the spec requires disclosure handling.
  Flag if the existing products carry affiliate links without disclosure.
- **Six tabs at 390px** is already solved (`BOTTOM_NAV_ICON_ONLY_THRESHOLD = 5`,
  tested at 4/5/6). Do not re-solve it.
- **The site links out; no on-site payments** — a standing rule in item 4a.

## Do not

- Don't render user submissions anywhere on the site.
- Don't fail a submission because an integration is unconfigured.
- Don't commit any key, or the Apps Script URL.
- Don't add on-site payment or checkout.
- Don't re-solve the bottom-nav degradation.
- Don't proceed past a failed verification — report it.
