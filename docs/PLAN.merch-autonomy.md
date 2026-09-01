# PLAN.merch-autonomy.md — The self-running Merch marketplace

**Status:** proposed. Written 2026-08-26 (Fable, from a live audit of the repo at
`main`, the deployed site, and current affiliate-program terms). Companion
execution spec: `SPEC.merch-autonomy.md` — this file says *what and why*, the
spec says *exactly how*.

**Revised 2026-08-29 — Awin is live.** Joey's Awin publisher account is up.
Awin is promoted from "the Etsy network" to the **primary network and the
primary product-sourcing database**: its per-advertiser product feeds (title,
price, stock, image, ready-made deeplink) become the first place the engines
look for matches, because anything found there is monetized by construction.
See the reworked affiliate architecture and the Awin-first sourcing rule
below; the spec gains engine **E0 (Awin Sync)** and reorders E6's search.

**Joey's brief:** solve nine issues (bad matches, dead links, broken images,
affiliate on everything, empty official bucket, empty fan-made bucket, a
new-merch discovery engine, a moment→product matching engine, plus Fable's own
additions) in a fully automated, AI-driven mode with human actions at or near
zero.

---

## Verdict: achievable at ~95% automation

Every engine, every fix, and every ongoing operation in this plan runs
unattended inside the repo's existing lane architecture (detect → judge →
gated auto-merge). The irreducible 5% is **identity-bound**: affiliate networks
require a legal person with tax info and a payout method, and API vendors
require an account with a payment card. No agent can (or should) sign those.
That 5% is **one batch of ~6 one-time signups, roughly 2–4 hours total**, then
a steady state of approximately zero — annual tax forms and the occasional
compliance email. Everything downstream of the credentials is automated.
One human gate sits outside the signup batch and is not a signup at all:
the standing **external IP-counsel review** (`docs/decisions.md` 2026-07-08
§3) before anything monetized ships — see Phase 2 and FR-MERCH-5. This gate
has since cleared (counsel sign-off recorded `docs/decisions.md`
2026-08-30, HUMAN-ACTIONS #27 DONE); it is restated here as the hard
launch gate the plan must always show, not as an open blocker.

The honest caveats, so nothing here oversells:

- **Amazon Associates has a probation gate**: the account must produce 3
  qualifying sales within 180 days and pass a content review, or it closes
  (reapplying is allowed). Automation can't buy things; real visitors must.
  With the site live and Amazon links present, this is a traffic problem, not
  an automation problem.
- **Approval risk is nonzero.** Awin/Etsy (~48h) and a catch-all network
  (site review) both approve sites like ours routinely — an independent fan
  content site with original editorial is exactly the publisher profile they
  want — but approval is their call, not ours. Etsy's affiliate policy also
  bars affiliates from using AI-generated *images*; our product/moment imagery
  is real photography, so we comply, but the rule is worth knowing.
- **Instagram/TikTok discovery is deferred**, not promised. Neither offers a
  usable public read API for this; scraping them is brittle and
  ToS-hostile. Reddit (public JSON), Etsy (official API), and our own
  submission form cover fan-made discovery well without them.
- **The official store has no affiliate program** (see Phase 2) — one of the
  three decisions below is yours because it trades revenue purity against
  completeness.

---

## Current state (audited 2026-08-26, `main`)

- **134 products** across **77 unique retailers** in `supabase/seed/**`
  (top: macduggal.com ×10, us.princesspolly.com ×9, amazon.com ×8,
  showpo.com ×5, revolve.com ×5 — then a 72-retailer long tail of 1–4 each).
- **110 of 134 (82%) are `isAlternative: true`** — the root of issue #1. Most
  cards are admitted look-alikes with no graded notion of *how* alike.
- **76 of 134 (57%) carry `imageUrl`**; the rest fall back to moment photos or
  monograms. No pipeline verifies any image still loads.
- **`buildShopUrl()` is deliberately inert** — every link is a raw retailer
  URL earning $0. The seam, the `isAffiliate` predicate, and the FTC
  `SHOP_DISCLOSURE` string are already built and waiting.
- **`officialStore: []` and `fanMade: []`** — hardcoded empty by honesty rule.
- **Infrastructure that already exists and gets reused, not rebuilt:**
  `check-link-liveness.mjs` (Karen's link-rot detector, report-only),
  `appearance-discovery.yml` (the zero-LLM detect → LLM judge pattern),
  `auto-merge-content.yml` + branch/author gates (unattended landing of
  content PRs), the social-poster queue (drops can feed it), the Merch page
  submission form with Turnstile, and `HUMAN-ACTIONS.md`.
- **store.taylorswift.com is Shopify** (verified: Shopify checkout token +
  `/cdn/shop/` CDN paths, Taylor Nation LLC / UMG). Shopify storefronts
  expose public `/products.json` and `/collections/<handle>/products.json`
  endpoints — the official catalog is machine-readable without keys.

## The nine issues → six engines + one seam flip

| # | Issue | Answer | Automation |
|---|---|---|---|
| 1 | Products don't look like what Taylor wears | **E3 Match Auditor** — vision model scores every product image against its moment photo; graded tiers replace the binary flag; mismatches auto-demoted and re-sourced | Full |
| 2 | Dead / "not found" links | **E1 Link & Stock Verifier** — Karen's detector grows an acting lane: re-resolve, replace, or mark `inStock:false` via gated PR | Full |
| 3 | Images don't load | **E2 Image Verifier** — HEAD-check every `imageUrl`, re-scrape `og:image` from the product page on failure | Full |
| 4 | Affiliate on every product | **Seam flip + resolver** — 3–4 network signups cover all 77 retailers; a generated coverage report tells you per-product how it monetizes | Full after signups + IP-counsel gate (cleared 2026-08-30) |
| 5 | Official bucket empty | **E4 Official Store Sync** — Shopify JSON crawl of the full catalog, diffed on a schedule (drops detection falls out for free) | Full |
| 6 | Fan-made bucket empty | **E5 Fan-Made Discovery** — Etsy API search + Reddit polling + the existing submission form; all items monetize via the one Etsy/Awin membership | Full after signups |
| 7 | Engine for newly released merch | E4 + E5 *are* that engine — both run on schedules and file only what's new | Full |
| 8 | Engine matching new fashion content to buyable products | **E6 Moment→Product Matcher** — triggers on newly merged fashion moments; vision-extract → shopping search → vision-verify → author products via the content gates | Full |
| 9 | Fable's additions | Match-tier badges, New Drops rail + social tie-in, "the look under $50" picks, revenue/click reporting into Marjorie's brief, Product schema.org for SEO, back-in-stock flips | Full |

## The affiliate architecture (issue #4, the "big task")

The wrong way to read "77 retailers" is "77 signups." The right architecture
is **four memberships that partition the hostname space**, resolved per
product by the `retailer` field that already exists for exactly this purpose:

1. **Awin — LIVE, and now primary.** Two roles: (a) the Etsy programme
   (merchant 6220, 4% content commission, 30-day cookie) monetizes the entire
   fan-made bucket through the one membership; (b) every long-tail retailer
   that is itself an Awin advertiser routes through Awin too. Awin membership
   is per-advertiser — joining each programme is a dashboard click, some
   auto-approve — so which of our 77 retailers Awin covers is a **queried
   fact, not a guess**: spec engine E0 audits our retailer list (weighted by
   clicks once those exist) against Awin's advertiser directory via the
   Publisher API and generates the apply shortlist for you to batch-approve.
2. **Amazon Associates** — `amazon.com` (8 products today, plus everything E5
   finds there, plus official merch that also sells on Amazon). Free; tag
   appended to URLs; 24-hour cookie; **the 3-sales/180-days probation above**.
3. **A catch-all network (D2) — demoted to residue-only, and deferred.**
   Only for retailers the coverage report proves are (a) not on Awin and
   (b) actually earning clicks. Don't sign up until that residue exists and
   is worth it; it may never be.
4. **Optional, later:** direct programs (Impact/Rakuten/CJ) where a network's
   cut meaningfully underpays a top retailer — a data-driven upgrade once
   click reports exist, not a launch requirement.

**Awin-first sourcing (the new rule the account unlocks).** Joined
advertisers' product feeds are a machine-readable catalog — the engines that
*find* products (E5, E6) search that catalog **first**, before brand-direct
hunts and before the paid search API, because a hit there arrives with
structured price/stock/image data and a guaranteed affiliate link, and costs
nothing to query. One guardrail keeps this honest (spec R2/R6): monetization
is a **tie-breaker at equal match tier, never a reason to list a worse
match**. If the best look-alike lives outside Awin, it's still the one we
show — with a monetized alternate beside it when one clears the same tier.

**Your per-product answer** is a generated artifact, not a document anyone
maintains: `docs/ops/AFFILIATE-COVERAGE.md`, rebuilt by CI, listing every
product → its resolved network → link format → status
(`wrapped / pending-signup / uncovered / direct-by-policy`). The definition of
done for issue #4 is that report showing zero `uncovered` rows (or each one
carrying an explicit policy reason).

## The official store problem (issue #5) — decision D1, settled: D1-a

Verified: **store.taylorswift.com has no affiliate program.** It's a UMG
(Taylor Nation LLC) Shopify store; no network lists it; nothing in its terms
offers one. Your "every product MUST have an affiliate link" rule therefore
collides with "fill the official bucket." **Joey decided D1-a** (recorded
`docs/decisions.md` 2026-08-30 "Merch autonomy: full official catalog with
verified Amazon alternatives..."): exempt the official bucket from the
affiliate rule. List the full official catalog unmonetized for completeness,
SEO, and drops coverage (drops feed the social poster — that's audience
growth, which is the asset). Where the same official item verifiably sells on
Amazon (Amazon hosts an official Taylor Swift artist merch page — vinyl, CDs,
some merch), E4 attaches a *secondary* "Also on Amazon" affiliate link.
Partial monetization, full catalog. D1-b (only official items with an Amazon
twin get listed) was considered and rejected — it would miss store exclusives
and most of the catalog.

## Fan-made posture — decision D3, settled: the hard curation rule below

Fan merch is inherently an IP gray zone. **Joey approved D3** (same
2026-08-30 decisions.md entry) as the hard fan-made curation rule the
curation gate enforces, not a preference: **"inspired-by" yes, bootleg no** —
E5 must reject items that reprint official artwork, tour graphics, or photos
of Taylor, and may curate original lyric-reference, era-color, and
original-design items.

## Decision D2 — the catch-all network

Skimlinks and Sovrn Commerce do the same job (one membership, huge merchant
list, ~70–75% of commission passed through, site review to join). The spec's
resolver treats the choice as one config value. Pick whichever approves you;
apply to one first, the other as fallback. Do not run both on the same links.

## Phases — trust first, then money, then growth

**Phase 0 — Signups (Joey, the only human phase).** File the HUMAN-ACTIONS
items below; agents proceed with everything not blocked on credentials —
or on the FR-MERCH-5 counsel gate, which credentials never open (Phase 2).

**Phase 1 — Fix what exists (E1, E2, E3).** Dead links, broken images, and
mismatched products destroy buyer trust and would get an affiliate
application rejected on review. Runs credential-free — starts immediately.

**Phase 2 — Turn on money.** The seam flip (small diff to `shop.ts` +
resolver config), disclosure auto-appears, coverage report goes live.
**Hard gate first (FR-MERCH-5):** per `docs/decisions.md` 2026-07-08 §3
nothing monetized ships, and per FR-MERCH-4/5 no affiliate/commercial
implementation (seam flip, E0, coverage wiring) even starts, until external
IP counsel has reviewed the affiliate layer (right-of-publicity, false
endorsement, FTC disclosure — HUMAN-ACTIONS #27). Credentials landing in
env does **not** open this phase; counsel sign-off does. **Status: the gate
has cleared** — counsel sign-off is recorded in `docs/decisions.md`
(2026-08-30) and HUMAN-ACTIONS #27 is DONE — so with credentials in env the
Awin branch is unblocked: Etsy links and every joined-advertiser link wrap
live, per network, without waiting on Amazon (`isAffiliate()` is per-network
by design). E0's programme audit belongs to this phase (it is affiliate
infrastructure, so it waited with it) and produces your first apply
shortlist.

**Phase 3 — Fill the buckets (E4, E5).** Official catalog sync; fan-made
discovery + curation. The Merch page's three-section design finally has three
real sections.

**Phase 4 — The engines run forever (E6 + issue-9 additions).** New fashion
moment → shoppable products within a day, automatically. New drops → site +
social. Weekly revenue/click report into Marjorie's brief closes the loop:
the data decides which retailers deserve direct programs and which looks
deserve re-matching.

## Costs (steady state)

- **Search API for E6** (SerpAPI-class Google Shopping access): ~$50/mo tier,
  likely less — the Awin product index now takes the first pass on every
  match for free, so the paid API only sees what Awin can't answer. A lower
  tier (~$10–30/mo) may suffice; start small.
- **Vision/LLM calls** (E3 audits, E5 curation, E6 matching): on the order of
  a few dollars/mo at this catalog size — batched, cached, within the repo's
  existing cost-discipline rules.
- **Awin APIs + product feeds, Etsy API, Reddit JSON, Shopify JSON, GitHub
  Actions:** $0.

## HUMAN-ACTIONS items to file (the whole human surface)

0. **External IP-counsel review — the Phase 2+ hard gate** (filed:
   HUMAN-ACTIONS #27, DONE). Engage counsel on the affiliate/commercial
   layer; nothing monetized ships, and no affiliate/commercial engine work
   starts, before sign-off (`docs/decisions.md` 2026-07-08 §3, FR-MERCH-4/5).
   Sign-off is recorded (`docs/decisions.md` 2026-08-30) — this gate is
   cleared, kept here as the standing rule the plan must always reflect.
1. **Amazon Associates signup** — identity, tax, payout; note the tag ID.
   ~20 min + probation caveat above.
2. **Awin — DONE** (account live). Two small follow-ups remain: in the
   dashboard, generate the Publisher API token and the Create-a-Feed API
   key (~5 min), and confirm the Etsy programme (6220) shows as joined.
3. **Awin programme applications** — when E0 generates the apply shortlist,
   batch-approve it in the dashboard (~10 min per batch; some advertisers
   auto-approve instantly). Recurring but tiny — the one standing human
   touch the Awin-first architecture adds, and each click permanently
   monetizes a retailer.
4. **Catch-all signup (D2)** — DEFERRED to residue-only; sign up only if
   the coverage report shows non-Awin retailers earning real clicks.
5. **Etsy Open API key request** — developer app on your Etsy account, for
   E5 search. ~15 min + approval wait.
6. **Search-API account** (SerpAPI or equivalent) — payment card. ~10 min.
   Expect lighter usage than originally scoped: the Awin product index
   absorbs a share of E6's searches for free.
7. **`vercel env add` / repo secrets** for the credentials above — one
   terminal session; exact commands in the spec. ~10 min.
8. **Decisions D1 / D3** — recorded in `docs/decisions.md`. D2 is no longer
   a launch decision; it re-opens only if the residue report justifies it.

After these: the system's ongoing demand on you is reading a line in
Marjorie's brief, if you feel like it.

## Risks

- **Affiliate application rejection** → fallback ordering (other catch-all;
  Amazon reapply). Phase 1 running first materially improves the site under
  review.
- **Shopify endpoint hardening** (rate limits / bot walls on the official
  store) → E4 falls back to sitemap + per-collection crawl at gentle cadence;
  worst case, weekly instead of twice daily.
- **Match-quality false positives from vision scoring** → graded tiers are
  displayed, not hidden; the UI never claims "exact" above the model's
  confidence, and E3's thresholds start conservative.
- **Affiliate ToS drift** (rates, cookie windows, program terms change) →
  the coverage report pins what we believe; a quarterly check task re-verifies
  terms. Nothing in content ever hard-codes a network URL — only the seam
  does, which is why it stays a one-file concern.
