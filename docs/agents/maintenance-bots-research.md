# Site-maintenance fleet — research & best practices (2026)

Research brief backing the four maintenance additions decided 2026-07-12: a
dependency/security bot (**Paul Blart**), an accessibility auditor (**Laura**),
a link-rot sweep folded into **Karen**, and an SEO/discoverability lens folded
into **Nils**. The through-line below is the same split the org already uses for
content (Karen *detects*, Kevin *acts*): **deterministic tools do detection;
an LLM agent adds judgment, triage, and surfacing — and a human still merges.**

---

## 1. Dependency & supply-chain security (→ Paul Blart)

**Layered defense, detection is native.** Best practice separates *detection*
(GitHub-native, zero-LLM) from *policy/action* (the bot):
- **Dependabot** — version + security updates, GitHub-native, surfaces in the
  Security tab, integrates with the dependency graph.
- **CodeQL** — code scanning on every PR.
- **Secret scanning + push protection** — repo setting; stops committed creds.
- **OpenSSF Scorecard** — rates dependency projects on 18+ security-hygiene
  checks (GitHub-hosted deps only).
- **Malicious-package / behavioral analysis** (Socket-style) — asks whether a
  package *does* anything malicious, not just whether it's outdated.
- **SBOM** — export from the dependency graph in a machine-readable format
  (SPDX or CycloneDX per CISA 2025 guidance).

**Update policy that actually works:**
- **Group aggressively.** Grouped updates cut PR volume 3–5× without losing
  meaningful granularity; steady state should be **< 5 dependency PRs/week** for
  a single app repo. Dependabot needs explicit `groups:`; Renovate groups OOTB.
- **Security updates ride a separate, faster lane** than routine version bumps.
- **Auto-merge is narrow.** Industry norm: auto-merge *patch-level only*, with a
  clean changelog, passing CI, and **no change in maintainer identity**.
  Auto-merging minor/major — or merging without reachability analysis — is
  exactly how a supply-chain attack amplifies across a fleet. **In this org the
  invariant is stricter: no bot ever merges. Paul Blart proposes/groups/surfaces;
  a human merges.**

**npm hardening (repo-level):** `npm ci` in CI (already done), lockfile pinning +
hash verification, disable install lifecycle scripts by default, generate an
SBOM, prefer SLSA provenance where available.

**Choice for us:** Dependabot (GitHub-native, frictionless) for detection +
grouping config; Renovate is the pick only if we outgrow Dependabot's grouping.
Paul Blart is the judgment layer on top.

Sources: [Renovate vs Dependabot enterprise 2026](https://safeguard.sh/resources/blog/renovate-vs-dependabot-enterprise-rollout-2026) ·
[systemshardening: auto-merge boundaries](https://www.systemshardening.com/articles/cicd/renovate-dependabot-security/) ·
[OpenSSF npm best practices](https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/) ·
[Sysdig: supply-chain best practices 2026](https://www.sysdig.com/learn-cloud-native/software-supply-chain-security-best-practices) ·
[Renovate bot comparison docs](https://docs.renovatebot.com/bot-comparison/)

---

## 2. Accessibility (→ Laura)

**axe-core is the industry standard engine** (it powers Lighthouse, Cypress,
Storybook, Chrome DevTools). Running axe directly catches more than Lighthouse's
subset. **pa11y** adds easy site-wide CLI/CI coverage.

**The 30–50% ceiling is the key fact.** Automated tools detect only ~30–50% of
WCAG issues. Alt-text *meaningfulness*, reading order, focus order, keyboard
operability of custom widgets, and screen-reader sensibility need human judgment.
So Laura's output must **file authorable specs AND flag what still needs a manual/
screen-reader pass** — never claim "accessible" from a green automated run.

**CI thresholds:** integrate axe into Playwright E2E and **fail on critical/serious
violations**; add pa11y-ci for breadth; Lighthouse a11y assertion `minScore: 0.9`
per deploy.

**Standard: WCAG 2.2 Level AA.** As of 2026 it's the baseline every law references
— **ADA Title II** (WCAG 2.1 AA; DOJ deadline **April 24, 2026** for large
entities, 2024 guidance cites 2.2), **Section 508** (2.0→2.1 AA), and the
**European Accessibility Act** (enforced **June 28, 2025**; EN 301 549, moving to
WCAG 2.2 in the 2026 v4.1.1 update). WCAG 2.2 added 9 criteria: focus appearance,
accessible authentication, drag-and-drop alternatives, target size, reduced
redundant entry. For a **public** site this is reach *and* legal exposure.

Sources: [Deque axe / John Lewis automating a11y](https://medium.com/john-lewis-software-engineering/automating-a11y-testing-part-1-axe-ed3d215de126) ·
[DWP: axe + pa11y](https://accessibility-manual.dwp.gov.uk/best-practice/automated-testing-using-axe-core-and-pa11y) ·
[CKEditor: 6 best automated a11y tools](https://ckeditor.com/blog/automated-accessibility-testing/) ·
[216digital: WCAG 2.2 AA 2026 checklist](https://216digital.com/wcag-2-2-level-aa-requirements-the-2026-compliance-checklist/) ·
[Level Access: EAA 2026](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/)

---

## 3. Link-rot / source liveness (→ Karen)

**Link rot is severe and constant:** an Ahrefs study of 2M+ domains found **66.5%
of links built since 2013 are dead.** A citation-heavy fan wiki decays silently
as sources move.

**Best practice:**
- **Weekly scans minimum**; also trigger on deploys that touch content.
- Check **external** links, not just internal — an expired outbound domain can be
  re-registered and point visitors somewhere untrusted (a *brand/safety* risk,
  which fits Karen's integrity mandate).
- Detect the full error space: **404/410, 403, SSL failures, connection errors,
  and soft-404s** (200 status with "not found" body).
- **Wayback fallback:** when a real source dies, the correct repair for a
  reference is usually the **archive.org/Wayback snapshot** of the original — it
  preserves the citation instead of dropping the fact. Ideal for us.
- Show context so fixes are fast; cross-check because tools miss different things.

**Fit:** Karen already checks *image* liveness + host reputation. Extend to **all
`source_url`s** in the corpus (text sources too), soft-404-aware, with Wayback
suggestions in the ticket. Karen stays **read-only** — she files tickets; Kevin/
Content Shift apply the fix.

Sources: [Semonto: 12 broken-link best practices 2026](https://semonto.com/blog/how-to-monitor-broken-links-12-seo-best-practices-2026) ·
[broken-links-checker: how often](https://broken-links-checker.com/blog/how-often-check-broken-links) ·
[Dr. Link Check](https://www.drlinkcheck.com/)

---

## 4. SEO / discoverability (→ Nils)

The site exists to be **found** by fans (and cited by AI answers). Next.js App
Router gives the primitives; nothing currently validates they're used.

**Best practice (Next.js 16 / App Router):**
- **Metadata API** as the foundation — server-rendered `title`, `description`,
  **canonical**, and **Open Graph**; use `generateMetadata` for dynamic era/track
  pages.
- **JSON-LD structured data** — `Article`/`BreadcrumbList`/`FAQ`/`Organization`,
  and for us the music vocabulary (`MusicAlbum`, `MusicRecording`, `Person`,
  `Event`). **Validate JSON-LD in CI** (Rich Results Test) — invalid markup fails
  silently and kills rich-snippet eligibility.
- **Dynamic `sitemap.ts` + `robots.txt`**; confirm indexing in Search Console.
- **Core Web Vitals**: Lighthouse mobile **> 90**, **INP < 200 ms**, no CLS, all
  images via `next/image` with explicit dimensions.
- **E-E-A-T / AI-search readiness**: depth + speed + clear structure is what gets
  a page referenced in AI-generated answers.

**Fit:** add a **discoverability lens** to Nils's existing walk — per page, does it
have title/description/canonical/OG, valid JSON-LD, is it in the sitemap. Nils
already fetches live pages and files `experience` specs; this is a new rubric
dimension, not a new bot. Heavy Lighthouse/CWV scoring can live in CI; Nils flags
what he can see in the fetched HTML and routes deeper perf work as a product spec.

Sources: [Pagepro: Next.js SEO 2026](https://pagepro.co/blog/nextjs-seo/) ·
[Next.js 16 SEO guide](https://medium.com/@thomasaugot/the-complete-guide-to-seo-optimization-in-next-js-15-1bdb118cffd7) ·
[Strapi: crawlable Next.js](https://strapi.io/blog/nextjs-seo)

---

## Design principles carried into the builds

1. **Detect deterministically, judge with an LLM.** Native scanners (Dependabot,
   CodeQL, axe/pa11y, link-liveness sweep) do detection; Paul Blart / Laura /
   Karen / Nils add triage, prioritization, and authorable specs.
2. **No bot merges; no bot auto-codes another desk's lane.** Paul Blart surfaces
   and groups dep PRs; Laura and Nils file specs; Austin (code) and Content Shift
   (content) implement; a human merges.
3. **Automated ≠ complete.** Especially a11y (30–50% ceiling) — always name the
   residual manual pass.
4. **Organize by trust/blast-radius, not just function** — consistent with the
   existing roster.
