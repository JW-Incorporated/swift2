# Social-source coverage and community refresh automation

**Status:** Binding implementation plan — approved scope, implementation not started

**Goal:** Keep the Community directory’s public Discord invites fresh and detect public, indexed references to approved Instagram/TikTok creator accounts without collecting from either platform directly. When a platform cannot be collected automatically under the rules below, create a bounded GitHub reminder with exact manual steps instead of silently going stale.

**Architecture:** Reuse the existing one-shot worker (`apps/worker`) and its data-configured `news_source` rows for no-account discovery signals. Add a separate deterministic Community refresh script and workflow that reads only the checked-in community record, calls Discord’s documented public invite lookup for Discord entries, and opens/updates one maintenance issue when a human-only check is due. The site continues to render checked-in typed data; no runtime source registration or production behavior changes in this planning PR.

**Scope boundary:** This plan authorizes no implementation in this PR. It does not add an account, key, credential, vendor, source row, schedule, platform scraper, production change, or live job. Any implementation must remain $0 and use only the mechanisms below until a later approved decision changes that posture.

---

## 1. Ground truth and source of record

### Community directory

The Community page is static, curated content:

- Canonical research record: `data/communities.json` (30 entries; verification, evidence, and checked-at metadata).
- Shipped typed copy: `apps/web/lib/longlive/communities.ts`, assembled from `communities-data-a.ts`, `communities-data-b.ts`, and `communities-data-c.ts`.
- Presentation: `apps/web/components/longlive/CommunitySection.tsx` and `CommunityCard.tsx`.
- Regression coverage: `apps/web/lib/longlive/communities.test.ts`.

The current record still contains `r/GaylorSwift`; the new implementation must remove it from both the canonical JSON and shipped typed data, and lock the exclusion in tests. `r/TravisAndTaylor` is already absent, but must be an explicit permanent exclusion as well. Neither subreddit may be fetched, stored, displayed, suggested, or added through an automated source configuration.

### Existing automated knowledge sources

The current ingestion mechanism is source-row driven:

- Workflow: `.github/workflows/news-worker.yml` (six scheduled cycles/day plus manual dispatch).
- Worker cycle: `apps/worker/src/pipeline/run-cycle.ts` loads enabled `news_source` rows.
- Adapter registry: `apps/worker/src/sources/registry.ts`.
- Generic account-free adapter: `apps/worker/src/sources/rss.ts`; it supports configured RSS/Atom URLs, including Google News RSS searches.
- Existing Google News seed pattern: `supabase/migrations/20260719190000_news_source_google_news.sql`.
- Source-type expansion migration: `supabase/migrations/20260901010000_knowledge_engine_fan_adapters.sql`.
- Worker health check: `scripts/knowledge-freshness.mjs`; it reports a stale Current tier but deliberately skips when data or credentials are not available.

The existing `reddit-rss` adapter (`apps/worker/src/sources/reddit-rss.ts`) is not a mechanism for this work. It must remain excluded from any source set created for social coverage, especially for the two named subreddits.

### Existing human-action reminder precedent

The Facebook export path is the model for a transparent fallback, not a collection mechanism to copy:

- Scheduler: `.github/workflows/fb-export-reminder.yml`.
- Idempotent issue writer: `scripts/knowledge-fb-export-reminder.mjs`.
- It uses only `GITHUB_TOKEN` and files a dated checklist issue.

The social-source fallback should use the same deterministic “one issue per time period” pattern, but with an Instagram/TikTok-specific checklist. It must never create a live social-platform session, use a browser automation tool against those platforms, or ask a human to export private content.

---

## 2. Compliance posture and permitted mechanisms

### Platform rules established from primary sources

1. **Instagram — no direct automated collection.** Instagram’s Help Center defines data scraping as automated access/collection and says its Terms do not allow attempts to access or collect information in unauthorized ways. Do not fetch creator profile pages, feeds, reels, HTML, GraphQL endpoints, or undocumented APIs. The existing Instagram media audit (`.github/workflows/social-audit.yml`) is credentialed access to Long Live’s own linked business account only; it must not be repurposed for third-party creator coverage.

2. **TikTok — no direct automated collection.** TikTok’s Developer Terms permit automated collection only as described in TikTok’s Developer Documentation and its developer terms. TikTok’s Research Tools are restricted to qualifying independent/academic/non-profit researchers with an approved research account and a defined research proposal; Long Live’s commercial fan app does not meet that no-account route. Do not fetch creator pages, use unofficial APIs, scrape, or create a TikTok developer/research account.

3. **Discord — direct public invite validation is permitted in the plan.** Discord’s official Invite Resource documents `GET /invites/{invite.code}` and its optional approximate member and online counts when `with_counts=true`. The planned validator may only resolve the already-published invite code, use those returned metadata fields, respect `429` and provider retry guidance, and never join a server, create an invite, enumerate members, or use a token.

4. **Reddit — named exclusions are absolute.** Reddit’s Data API Terms require authorized API access and impose use/retention restrictions. This work does not add any Reddit source. The two named excluded communities are a product/data policy restriction in addition to provider terms.

### Approved no-account, no-cost automation

| Need | Mechanism | Permitted output | Not permitted |
| --- | --- | --- | --- |
| Detect that an approved Instagram/TikTok creator account may have been referenced publicly | Configure account-specific Google News RSS searches through the existing `rss`/`google_news` source path, using the existing migration pattern. Treat results as leads only. | The existing `news_raw_item` fields only: headline, RSS URL, publisher attribution, and date. | Fetching Instagram/TikTok pages, posts, profiles, embedded data, comments, media, follower counts, or private/age-gated content. |
| Keep Discord community links fresh | Public Discord `GET /invites/{code}?with_counts=true` for only the existing listed Discord URLs. | Link reachability, approximate member/presence counts if returned, check timestamp, and failure reason class. | Joining, creating/deleting invites, member lookup, token use, server moderation, or any write. |
| Prompt for an unavailable platform check | Scheduled GitHub issue using built-in `GITHUB_TOKEN`, idempotent per week. | Exact creator handles, last signal/check date, direct URLs already approved in configuration, and manual verification instructions. | Logging in, taking account credentials, making a platform account, copying post bodies/comments, or automatically publishing data. |

A Google News RSS lead is not proof that a creator posted something. It is only a bounded prompt to check the public creator account manually. It must never be promoted into `current_item`, `fan_signal`, or the Community directory without the existing verification/editorial path.

### Unsupported routes and explicit reasons

- **Instagram direct profile/post ingestion:** unsupported without an authorized Meta product/API route; the public research Content Library API requires eligible research affiliation, approval, and a Secure Research Environment, so it is not a no-account route for this product.
- **TikTok direct creator/post ingestion:** unsupported without an approved TikTok developer/research route; its documented Research Tools have eligibility, account, application, and data-security requirements.
- **Third-party scraping vendors, proxies, or browser automation:** prohibited for this project because they would evade the provider constraints above; none will be evaluated or priced in this implementation.
- **Paid social/listening APIs:** out of scope. No published annual cost is needed because no vendor is being selected. If one is proposed later, record the provider’s published monthly price × 12 (or a quote as a quote) before any spend decision.

---

## 3. Proposed data model and fail-closed behavior

### New checked-in configuration (implementation)

Create `data/social-source-watchlist.json` as the sole source of truth for allowed creator-account coverage. It must contain only owner-approved public account identifiers and the minimum fields required to construct Google News RSS queries and a manual checklist:

```json
{
  "version": 1,
  "excluded_reddit_communities": ["TravisAndTaylor", "GaylorSwift"],
  "creator_accounts": [
    {
      "platform": "instagram",
      "handle": "example",
      "profile_url": "https://www.instagram.com/example/",
      "enabled": true
    }
  ]
}
```

Do not seed real handles in the implementation without the already-approved source list. A malformed, duplicate, non-HTTPS, unsupported-platform, or excluded entry must fail validation. A disabled entry is valid but produces no source row or reminder item. No raw post content, usernames other than the configured creator handle, follower counts, media URLs, comments, or credentials belong in this file.

### Community refresh output

Create a generated audit artifact under `docs/audits/` (for example, `docs/audits/community-refresh-latest.md`) from the checked-in community data. The artifact must list only:

- checked timestamp;
- each Discord entry’s published URL, normalized invite code, reachability result, and approximate counts only when returned;
- a non-Discord “not automatically checked” count;
- failures grouped as invalid URL, 404/expired, 429/deferred, provider error, or parse error;
- the two Reddit exclusions and an assertion that neither was read.

The artifact is evidence, not a self-updating production data source. A successful automatic Discord check may propose a data refresh, but updating the checked-in community dataset must happen only in a normal reviewed PR. A failed or rate-limited run must not erase the prior verified value, downgrade it to zero, or delete an entry.

### Cross-workflow creator-lead status receipt

The `news-worker` is the only workflow that may read the worker database, because its existing secret-backed execution already performs the Google News RSS cycle. Extend that workflow to emit a separate credential-free JSON receipt at `docs/content-ops/social-source-status.json` on the existing `news-digest` branch. It is a bounded cross-workflow interface, not a new database or source row. Its strict schema contains only `schema_version`, `generated_at`, `lookback_start`, and one status record per configured social source: deterministic source name, `last_polled_at`, `status` (`lead`, `no_lead`, or `unavailable`), and `lead_count`. It must contain no headline, URL, snippet, publisher, handle beyond the configured source name, database identifier, or secret.

The receipt generator queries only social-source rows selected by the deterministic source-name prefix created in Task 2 and their `news_raw_item` counts within the declared lookback. A source polled in that window with one or more rows is `lead`; one polled with none is `no_lead`; a missing row, missing/old poll timestamp, or unreadable result is `unavailable`. The existing `news-worker` publication step must publish this receipt beside `docs/content-ops/news-candidates.md` to `news-digest`; it must fail the job if publication fails, just as the existing digest does. The reminder workflow reads the receipt using GitHub's contents API at `ref=news-digest` with its existing `contents: read` permission. It never receives a database credential or queries `news_raw_item` directly.
### Health conditions

- **Healthy:** all configured Discord invites resolve, the audit is newer than 14 days, and the last creator-signal run completed without configuration errors.
- **Degraded:** one or more Discord invites fail or rate-limit, a creator query has no results, or a manual social check is due. Preserve last known data and create/update the maintenance issue.
- **Fail closed:** invalid configuration, a response outside the allowed schema, an unsupported platform request, an attempted excluded subreddit, or an HTTP authentication requirement. Do not retry around access restrictions or substitute scraped data.

---

## 4. Sequenced implementation breakdown

### Task 1 — Establish the social-source policy and configuration contract

**Files**
- Create: `data/social-source-watchlist.json`
- Create: `scripts/social-source-watchlist.test.mjs`
- Modify: `package.json`

**Work**
1. Define the JSON schema and validate it with a dependency-free Node script.
2. Hard-code the exclusions `TravisAndTaylor` and `GaylorSwift` as required values, not optional prose.
3. Add `npm run validate:social-sources` to run the schema, uniqueness, HTTPS, allowed-platform, and exclusion checks.
4. Do not add a creator handle or a schedule in this task unless it is present in the approved source scope.

**Verification**
```sh
npm run validate:social-sources
npm run test -- scripts/social-source-watchlist.test.mjs
```

### Task 2 — Add a lead-only Google News RSS source seeder

**Files**
- Create: `scripts/social-source-sync.mjs`
- Create: `scripts/social-source-sync.test.mjs`
- Create: `supabase/migrations/<timestamp>_social_source_watchlist.sql`
- Modify: `package.json`
- Modify only if required by testable source type reuse: `apps/worker/src/sources/rss.ts`
- Modify: `scripts/news/emit-candidate-digest.mjs`
- Modify: `.github/workflows/news-worker.yml`

**Work**
1. Generate deterministic Google News RSS query URLs from each enabled configuration entry, without requesting Instagram or TikTok.
2. Insert only idempotent `news_source` rows using the existing source-seed migration pattern. Name every row so it records platform and handle without putting them in unrelated source types.
3. Use `google_news`/RSS only as a lead source. Its tier remains `unverified`; no source row may imply official-platform verification. The existing `news_raw_item` schema remains unchanged: a source row identifies a manual-only platform lead by its deterministic configured source name and URL, not by a new per-item marker.
4. Reject duplicates during validation; allow disabled accounts to validate but produce no source row. Never delete existing rows in this task.
5. Include the permanent exclusion assertion in the seeder test suite.
6. Extend the existing secret-backed digest emitter to write the strict, non-secret `docs/content-ops/social-source-status.json` receipt defined above. Update the existing `news-digest` publication step to publish both generated files, and test `lead`, `no_lead`, and `unavailable` status derivation without retaining raw items. The receipt is the only permitted creator-lead input to Task 4.

**Verification**
```sh
npm run validate:social-sources
npm run test -- scripts/social-source-sync.test.mjs
npm run typecheck
```

Do not run `npm run db:migrate` against production from this task unless the project’s normal credential/prod gate is separately satisfied. The migration’s idempotency must be covered in the project’s safe migration test path first.

### Task 3 — Implement the Discord invite refresh auditor

**Files**
- Create: `scripts/community-refresh.mjs`
- Create: `scripts/community-refresh.test.mjs`
- Create: `test/fixtures/community-refresh.json`
- Modify: `package.json`

**Work**
1. Read `data/communities.json`, extracting only `platform === "Discord"` URLs.
2. Normalize invite URLs to invite codes without accepting arbitrary Discord API endpoints.
3. Call the documented public invite endpoint with `with_counts=true`, one request at a time and a bounded timeout.
4. On `429`, stop remaining live calls, record deferred status, and allow the next scheduled run to try again. Do not retry in a loop.
5. Emit deterministic Markdown/JSON audit output with no personal/member-level data. The scheduled workflow consumes the Markdown as its same-run issue body/comment; it does not commit generated audit data to `main`.
6. Assert the audit never reads or lists either excluded subreddit and that a missing count remains `null` rather than zero.

**Verification**
```sh
npm run test -- scripts/community-refresh.test.mjs
node scripts/community-refresh.mjs --fixture test/fixtures/community-refresh.json --output /tmp/community-refresh.md
git diff --check
```

### Task 4 — Add the idempotent human-action fallback

**Files**
- Create: `scripts/social-source-manual-reminder.mjs`
- Create: `scripts/social-source-manual-reminder.test.mjs`
- Create: `.github/workflows/social-source-refresh.yml`

**Work**
1. Follow `scripts/knowledge-fb-export-reminder.mjs`’s exact-title/idempotency pattern: one open issue per calendar week, updated on re-run instead of duplicated.
2. Schedule a weekly run and offer `workflow_dispatch` with `dry_run: true` by default. In each run, invoke `scripts/community-refresh.mjs`, save its Markdown to the runner’s temporary directory, fetch only `docs/content-ops/social-source-status.json` from `news-digest` through GitHub's contents API, validate its strict schema and freshness, then pass both bounded receipts to `scripts/social-source-manual-reminder.mjs`. No workflow input may query the worker database or contain a worker secret.
3. Make reminder behavior deterministic from the two receipts. If every creator source is `no_lead` and the Discord audit is healthy, make no GitHub write. If a creator source is `lead` or `unavailable` (including a missing, malformed, or stale status receipt), create/update that calendar week's exact-title issue; for `lead`, list only the matching configured account URL(s), and for `unavailable`, list all configured account URL(s) and state that automated lead collection could not complete. If the Discord audit reports an invalid/expired invite, provider error, or `429/deferred`, include that audit result in the same issue; `429/deferred` states that the next weekly run will retry once and does not ask a human to evade the rate limit. On a same-week re-run with an already-open issue, comment the current deterministic status rather than create a duplicate; never close a lead-triggered issue merely because a later receipt is `no_lead`.
4. Include only the exact approved account URLs, the receipt timestamp/status (`lead`, `no_lead`, or `unavailable`), the current Discord audit status, and these manual instructions when a creator check is required:
   - open the listed public creator profile in a normal browser without using developer tools or automation;
   - record only whether the profile/post is publicly reachable and the public URL/date needed to verify an existing lead;
   - do not copy captions, comments, private content, follower lists, media files, or account credentials;
   - if the item is real and relevant, file it through the existing content-intake path; otherwise close the issue as “no verified public lead.”
5. The workflow may use only built-in `GITHUB_TOKEN` with `contents: read` and `issues: write`. It must not receive Instagram/TikTok credentials. Its `429` result is a normal deferred check: the next weekly schedule retries once, with no in-run retry loop.

**Verification**
```sh
npm run test -- scripts/social-source-manual-reminder.test.mjs
DRY_RUN=true node scripts/social-source-manual-reminder.mjs
```

### Task 5 — Wire health reporting and enforce the data exclusions

**Files**
- Modify: `.github/workflows/watchdog.yml`
- Modify: `scripts/knowledge-freshness.mjs` only if a reusable non-secret health convention is appropriate
- Modify: `apps/web/lib/longlive/communities-data-*.ts`
- Modify: `apps/web/lib/longlive/communities.test.ts`
- Modify: `data/communities.json`
- Create: `scripts/community-refresh-health.mjs` and `scripts/community-refresh-health.test.mjs` if watchdog integration needs an adapter

**Work**
1. Remove `r/GaylorSwift` from both research and shipped typed copies; confirm `r/TravisAndTaylor` remains absent.
2. Replace brittle exact-count community tests with assertions that preserve required exclusions and the canonical/shipped data agreement, updating expected counts only from the verified source file.
3. Report stale Discord audit or overdue manual check as a maintenance issue/update, not as an automatic data rewrite. The issue body/comment from Task 4 is the durable health receipt; watchdog reads only its dated, machine-written status marker rather than a generated file on `main`.
4. Make health reporting distinguish “no account/no direct platform API by policy” from an infrastructure failure. A lack of Instagram/TikTok collection is expected and must not page as a broken job.

**Verification**
```sh
npm run test -- apps/web/lib/longlive/communities.test.ts scripts/community-refresh-health.test.mjs
npm run validate:social-sources
npm run typecheck
npm run test
npm run lint
npm run format
npm run build
```

### Task 6 — Documentation and operational receipt

**Files**
- Modify: `docs/decisions.md`
- Modify: `docs/marketing/social-strategy.md` only if it names source-collection rules
- Modify: `apps/worker/README.md`
- Modify: `docs/ops/community-merch-submissions.md` only if it needs to point to the new community-maintenance issue

**Work**
1. Record the provider-compliance decision, no-account mechanisms, retained-data limits, source exclusions, and health/fallback behavior.
2. State that the new workflow is lead detection and Community link audit—not a social scraper or automatic publishing system.
3. Link the exact primary terms below and record the access date in the decision entry.
4. Document the emergency rollback: disable the workflow, leave existing Community data untouched, and close the reminder issue. No destructive data action is required.

**Verification**
```sh
npm run format
npm run test
npm run typecheck
npm run lint
npm run build
```

---

## 5. Required test matrix

| Case | Expected result |
| --- | --- |
| Valid Discord invite returns counts | Audit records reachability and approximate counts with timestamp. |
| Expired/404 Discord invite | Audit records failure; existing directory entry and prior count are preserved; maintenance issue is updated. |
| Discord 429 | Auditor stops further API calls, records deferred, and does not retry-storm. |
| Non-Discord community | No network request; reported as not automatically checked. |
| Instagram/TikTok enabled configuration item | Only a Google News RSS lead source is generated; no direct platform request occurs. |
| Unsupported platform or non-HTTPS URL | Validation fails before any source sync/network action. |
| `r/TravisAndTaylor` or `r/GaylorSwift` appears in an operational input/output | Validation/test fails; no source row, fetched target, UI/community entry, generated lead/audit data, or reminder item is emitted. The required policy configuration and its exclusion assertion may name both values. |
| Manual reminder re-run in same week | Existing exact-title issue is updated, not duplicated. |
| Manual workflow dispatch | Defaults to dry-run and makes no GitHub write. |
| No source lead or no manual verification | Report an honest “no verified public lead”; never invent freshness, activity, or a post. |

---

## 6. Operational limits, costs, and decisions

- **Spend:** $0. This plan selects no paid vendor and creates no account. No annualized recurring charge exists.
- **Credentials:** none for the Discord/public-RSS and GitHub Actions mechanisms described here. `GITHUB_TOKEN` is built-in workflow capability, not a new secret. Existing own-account Instagram credentials remain out of scope.
- **Retention:** store configuration and audit metadata only. Do not persist platform post bodies, comments, media, individual identities, follower lists, private-account information, or credentials.
- **Human fallback:** the scheduled issue is the operational endpoint when direct collection is unavailable. It is not a request for a human to research the internet; it gives an exact small verification action triggered only by an existing automated lead or overdue audit.
- **Escalation trigger:** a future request for direct Instagram/TikTok API access, a provider account, a vendor, credential, paid tier, or expanded platform data requires a new decision record and the appropriate owner approval before implementation.

---

## 7. Primary-source references (accessed 2026-08-30)

- Instagram Help Center, “Why your account has been restricted for data scraping and what can you do”: https://help.instagram.com/740480200552298
- TikTok Developer Terms of Service (modified 2025-12-26): https://www.tiktok.com/legal/tik-tok-developer-terms-of-service?lang=en
- TikTok Research Tools eligibility: https://developers.tiktok.com/products/research-api/
- Discord Developer Documentation, Invite Resource: https://docs.discord.com/developers/resources/invite
- Meta Content Library and API eligibility: https://transparency.meta.com/researchtools/meta-content-library
- Reddit Data API Terms (last revised 2026-07-20): https://redditinc.com/policies/data-api-terms

These sources establish the compliance constraints. The implementation must re-check the provider terms immediately before enabling any new source type because provider policies and endpoint access can change.
