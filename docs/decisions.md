# Decision Log

Every decision that would be expensive to reverse gets an entry here BEFORE
implementation. Newest first.

Format: date, decision, why, alternatives considered, who approved.

---

## 2026-07-03 — Product calls: hide fakes, month-slider in v1

**Decision:** (1) Fake / unverified stories are **hidden** from the feed, not
shown-and-labelled — the feed only surfaces stories that clear the credibility
bar. (2) The **month-level timeline slider ships in v1**, alongside the era
switcher. Both are expected to iterate a few times.

**Why:** Cleaner trust model (never surface a story we can't stand behind) and
the month slider is central to the "time travel" experience, not a nice-to-have.

**Approved by:** Wyatt (relaying Joey's product calls). Resolves two of the
three [confirm] items from the v0.2 entry; the notification-quality threshold
and exact credibility bar remain tuning parameters, not blockers.

## 2026-07-02 — Architecture reconciled with vision.md (v0.2)

**Decision:** After Joey wrote `vision.md`, correct three v0.1 assumptions:
(1) **Vault is not static/editorial** — recent-news and time-travel are one
time-indexed store of classified/ranked/verified stories, differing only in
presentation; a thin repo-versioned editorial layer (era theming tokens +
wavetop milestones) sits on top. This **supersedes** the earlier "Vault and
News are separate data worlds" entry. (2) **Reuse Orbit's ingest pipeline**,
not just its stack — ingest→cluster→classify→verify→rank→notify is the core.
(3) **Auth is load-bearing in v1** (personalized, rate-tuned notifications need
accounts). Also adds two first-class subsystems: **notifications**
(per-user subscription + quality/rate gate + push) and **verification/
credibility** (worker-side AI signal + user signal).

**Why:** The vision's centerpiece is a verified live news feed with
notifications as the retention loop, plus a time-travel view over the *same*
data by era/month. That is Orbit's problem shape, so the reuse deepens from
"stack" to "pipeline," and a static Vault no longer fits.

**Interpretive calls flagged [confirm] for Wyatt/Joey:** fake-story handling
(label-and-show vs hide), quantitative "high-quality" notification threshold,
whether the month-level slider is v1 or v1.x. See architecture.md open
questions.

**Approved by:** proposed by Claude in-session; **pending Wyatt/Joey ratify**
(made per "don't stop to ask"; reversible via PR review).

## 2026-07-02 — Cost strategy: two bills, and codify repetition

**Decision:** Manage build cost and runtime cost separately. Build: we run both
Max (scarce resource = rate-limit window; sequence heavy jobs around refreshes,
grip-and-rip within a window) and API (scarce resource = dollars; use a Console
spend cap + alerts, not manual tracking). Runtime: keep the Vault static, any
product LLM call is worker-side/capped/fallback, never in a user path. Standing
rule (now CLAUDE.md workflow rule 8): if an AI does the same procedural task
twice, or foresees it recurring >2×, it writes and commits reusable code for it
instead of re-executing token-by-token.

**Why:** Repeated manual execution costs tokens linearly and drifts; codifying
it is O(1) and deterministic. The biggest build-cost sink is rework, addressed
by spec-before-code + small PRs. A hand-kept spend spreadsheet is stale on
arrival; Console caps/alerts aren't.

**Alternatives considered:** Manual Excel bill-tracking (rejected: stale,
redundant with Console on API and meaningless on flat-rate Max). Pay-everything
-up-front with no discipline (rejected: fine for dollars, but ignores rework and
rate-limit throughput, the actual constraints).

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Reuse Orbit's stack, separate backend

**Decision:** Adopt the sibling project Orbit's stack topology wholesale —
TypeScript, Next.js (App Router) on Vercel for web, Expo/React Native for
mobile, Supabase for DB/auth/storage, npm-workspace monorepo with
`packages/shared` (portable domain, no I/O) + `packages/core` (data access).
Reuse Orbit's *code patterns and layout*, but stand up a **new, isolated
Supabase project** — do NOT share Orbit's backend, data, or quota.

**Why:** Orbit already runs this exact shape of problem in production; a
two-person AI-first team can't afford novel infra. Isolating the backend keeps
two products' prod data, cost, and blast radius separate (Orbit's own rules are
strict about a single shared backend).

**Alternatives considered:** (a) Green-field stack selection — rejected, no
upside over a proven one we operate daily. (b) Literally share Orbit's Supabase
project — rejected, entangles two products' data and quota; Wyatt can flip this
if Swift2 turns out to be an Orbit evolution rather than a distinct product.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Vault and News are separate data worlds

**Decision:** Curated Vault content (eras, milestones, fashion) and live
News/Current content live in separate tables and separate app surfaces. Vault
is authored/versioned in the repo, static between deploys, CDN-cached; News is
volatile and pipeline-driven.

**Why:** They have opposite freshness/caching needs; coupling would force the
Vault to inherit the feed's volatility for no benefit.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Era-scrubber gesture layer is per-platform

**Decision:** The Vault timeline scrubber is built as the app's reference
workload with a hard 60fps budget. Its data model, ordering, and snap math live
in shared packages, but the gesture recognizer + animated timeline are
implemented **twice** — web (Pointer Events + CSS transforms + rAF) and native
(Reanimated worklets + Gesture Handler on the UI thread). v1 snaps to **era
boundaries only**; milestones (wavetops: album releases + tours) are anchors,
not snap targets.

**Why:** "Smooth and low-latency" is the feature. A shared abstraction over two
very different animation runtimes would risk the frame budget and cost more than
it saves. Per-frame React state is banned on both platforms.

**Approved by:** Wyatt (CTO)

## 2026-07-02 — Adopt dual-AI operating model

**Decision:** Claude Code is the hub (planning + building); Codex runs inside
it via the official plugin (reviewing + delegated tasks). Roles are modes
defined in CLAUDE.md, not separate agents. QA is automated tests + CI, not an
AI role.

**Why:** Cross-provider review catches issues self-review can't; one-session
workflow avoids copy-paste overhead; lean docs over an 11-file process that
would go stale.

**Alternatives considered:** Separate PM/Engineer/Reviewer/QA AI agents
(rejected: ceremony without benefit at 2-person scale, unaffordable on
current plans).

**Approved by:** Joey

## 2026-07-02 — Repo is the source of truth

**Decision:** All knowledge lives in Git. Nothing important exists only in an
AI conversation. Core docs: CLAUDE.md, AGENTS.md, docs/vision.md,
docs/architecture.md, docs/decisions.md. New docs added only when their
absence causes real pain.

**Why:** Docs nobody maintains are worse than none; agents act on stale info.

**Approved by:** Joey
