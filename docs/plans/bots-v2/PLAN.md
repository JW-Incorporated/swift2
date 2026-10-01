# Bots v2 — Marjorie + Tree run the site together

Owner brief 2026-09-30 (Joey): Marjorie and Tree are underperforming; they
must manage the site together with every tool we built them and every tool
Hermes has. Growth is priority #1. Program owner: Claude (delegated all
reversible calls). Done = every requirement below is met and verified live.

## Calls made (reversible — stated, not asked)

- **C1 Status artifact = one pinned GitHub issue** (label `status-page`),
  body rewritten deterministically (no LLM) every 3h and on HA/social
  changes. Permanent URL, phone notifications, comments = replies. A
  claude.ai artifact can't be written by Actions, so it was rejected.
  Discord gets a one-line daily ping + link; daily brief issues stop.
- **C2 Weekly Fable review files GitHub issues itself** (the fleet funnel
  Kevin→Austin already works). bot1 can't receive bot messages today
  (`DISCORD_ALLOW_BOTS` none) and Hermes cards are invisible to swift2's
  pipeline, so routing the plan through bot1 adds a hop and a dependency.
  bot1 is reserved for Marjorie's unblocking asks (C5).
- **C3 One approval per post = one Discord message ≤ 2000 chars**
  (Discord's hard API limit for webhook `content`; enforced by test).
  Image shown as an attachment/explicit embed; full text behind a link.
- **C4 Every post is an IG+X pair by default** — same image, text shaped
  per platform. Single-platform only with a written `singlePlatformReason`
  (legit cases: no usable image → X-only; breaking news where speed beats
  polish → X first, IG later). One ✅ approves the pair.
- **C5 Marjorie→bot1 bridge** posts to `#longlive` via a dedicated webhook,
  gated by a committed config flag (default off), ≤3 prompts/day, shaped by
  a `prompting-bot1` skill. Turning it on needs the Hermes allowlist change
  (Hermes-session only, rule l) + webhook secret → human action.
- **C6 Link previews off in code**, not channel permissions: every webhook
  post sets `flags: 4` (SUPPRESS_EMBEDS) unless it carries a deliberate image
  embed, in which case bare URLs are `<…>`-wrapped. Channel-level Embed Links
  removal would also kill the approval image.

## Workstreams

Each lands as its own PR (branch per stream, worktree outside Projects/),
Claude review of the diff before opening, tests + `npm run lint` +
typecheck, merge/auto-merge, never babysit. Social code is never sent to
Codex.

### W2 Tree approval UX (`scripts/social/approval-prompt.mjs`,
`social-approval-poll.mjs`, `lib/feedback.mjs`, drafter prompts, check-drafts)
- One message per post (campaign pair): image, X text in full, IG caption
  trimmed with link to full text, schedule, one-line why, ref line last.
  Header message dropped. Test: every built message ≤ 2000, exactly one per
  post, across real fixtures (PR #4544 shapes).
- ✅ from owner on the post → approve both halves (signed stamp per file,
  schema v2 unchanged in strength).
- Any owner reply to a post → reject both halves, reason = reply text, no
  ❌ needed; bot adds ❌ to the post as confirmation (fallback: a short
  webhook reply "❌ rejected — reason logged" if the token lacks Add
  Reactions; then file an HA for the permission). ❌ alone still rejects
  (reason "none given"), no nudge.
- Drafter emits pairs by default (C4); check-drafts enforces pair or reason.
- Link previews per C6 on all Tree senders.

### W3 Community reply opportunities (`scripts/community/**`)
- Verify which channel the mailer's webhook targets (webhook GET → channel
  id, metadata only). Reformat each opportunity as its own short message:
  platform/sub, title, `<link>`, one-line why, reply text in a code block
  ready to copy. Flags per C6. Add count + links to the status page.
- Facebook leads stay blocked on HA #88 (owner's FB login) — surfaced on the
  status page, not re-raised.

### W4 Status page + Marjorie delivery (`scripts/marjorie/**`, new workflow)
- `status-page.mjs` sections: Needs you (HUMAN-ACTIONS.md items: title,
  one-line why, link to the entry; `[DECIDE]` items show options + decision
  criteria + "reply `decide #N <choice>`"), Shipped last 7 days (merged PRs,
  bot/dependency/snapshot noise filtered, plain titles, by day), Next up
  (latest weekly plan + in-flight PRs), Growth, Tree (published 7d, pending
  approvals).
- Owner comment `decide #N <choice>` / `done #N` on the status issue →
  `ha-close.mjs` path, ack comment, re-render. Other owner comments → relay
  to Marjorie chat.
- Daily brief: Marjorie's judgment note goes into the status page; one-line
  Discord ping; stop opening daily brief issues; close stale ones.
- `flags: 4` in `scripts/marjorie/lib/discord.mjs`.

### W5 Marjorie brain (charter, weekly Fable review, bot1 bridge)
- Charter (`docs/agents/marjorie.md`) + brief prompt: mission = grow the
  site by giving fans value; growth #1; fashion revenue is the long-term
  monetisation once traffic exists. Strip stale launch/email text.
- Growth data collector: followers, posts published, engagement, content
  shipped, time-sensitive coverage (calendar/event-status vs published),
  site traffic (Vercel Analytics if a read token exists; else HA).
- `routine-marjorie-weekly-review.yml` (Fable, Sunday, before Tree's Monday
  plan): answers — Are we growing, why/why not? Is content top tier? Is
  social strategy good? Are we catching time-sensitive content (e.g. Patient
  Zero)? How do we make money? Are Tree's asks addressed? — then writes the
  week's plan as a `weekly-plan` issue, files work issues (deduped, capped),
  and files strategy feedback to Tree (`marjorie-filed desk:tree`).
- bot1 bridge per C5 + `.claude/skills/prompting-bot1/SKILL.md`; Hermes
  allowlist request filed as a JW-Incorporated/Hermes issue + HA.

### W7 Tree↔Marjorie live loop
- Tree may file a help ask (`tree-filed desk:ops`) on any run; the filer
  dispatches Marjorie immediately (issues made with GITHUB_TOKEN don't fire
  `issues` events — dispatch explicitly). Marjorie answers on the issue:
  accept now / schedule / decline + why / reroute to an engineering issue,
  against the weekly plan.
- Marjorie feedback to Tree dispatches Tree immediately; Tree replies: doing
  it (and updates strategy/lessons now) / can't because / needs help.
- Loop guards: dispatch on creation only, daily cap. Fix the 09-30
  `routine-marjorie-triage`/`-ops` failures.

### W8 Tree drafter deadlock
- #4117 recheck verdict "gate sound, drafter deadlocked": L001 vs schema vs
  check-drafts collide on photo reuse; 09-30 daily draft died at turn cap.
  Resolve the rule collision, bound the run. Site-made share cards (W9) are
  a sanctioned image source.

### W9 Share-image generator
- Research: would fans post site-made TS images; what differentiates.
  Working thesis: images *of our site* (moment/era cards, stats, timelines)
  rendered beautifully with a small longlivets.com watermark, built on the
  existing `/api/og` + `og-card.tsx` stack; photo use carries credits.
  Spec → MVP share button (IG portrait + story sizes) → Tree uses them.

## Human actions this program needs
- Marjorie→bot1: create a `#longlive` webhook, store as secret
  `DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL` (env `ops`), Hermes session adds it
  to bot1's allowlist (H1+H2), then flip the config flag.
- Add Reactions for the swift2 read bot in `#longlive-tree` — only if W2
  confirms it lacks it.
- Vercel Analytics read token — only if W5 finds no existing source.

## Status
| Stream | State |
|---|---|
| W2 | building |
| W3 | queued |
| W4 | building |
| W5 | building |
| W7 | queued |
| W8 | queued |
| W9 | queued |
