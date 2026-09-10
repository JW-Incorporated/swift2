# Revision: routines migration can run on Joey's Claude plan, not metered API billing

**Filed:** 2026-09-05 — follow-up to `t_6dcfb062` / PR #3813 (kanban `t_798712c4`,
board `swift2`).
**Supersedes:** the "What it costs → Tokens" section and Decision D1 of
`docs/audits/2026-09-05-claude-routines-relocation-assessment.md`. Everything
else in that document (the routine → workflow mapping, the human-action root
cause, the efficiency findings) still stands unchanged.

**Why this exists:** Joey rejected the original D1 as posed — *"D1=D - I dont
accept this. There must be a way that can also use my claude plan."* — and he
was right. The original assessment defaulted to `ANTHROPIC_API_KEY`
(pay-per-token) without checking whether `claude-code-action` supports
subscription auth. It does.

## The correction, in one line

`claude-code-action` accepts **`CLAUDE_CODE_OAUTH_TOKEN`** as an alternative
to `ANTHROPIC_API_KEY`. A token generated with `claude setup-token` on a Pro
or Max account draws on that account's normal Claude Code plan usage (the
same 5-hour/weekly allowance interactive sessions use) instead of billing
per token. This works for **every** trigger type the action supports —
`schedule:`, `workflow_dispatch:`, `issue_comment:`, `pull_request:` — because
the trigger only decides *when* the action runs; the credential decides
*how it's billed*. Nothing about a cron-scheduled routine forces API billing.
Source: `anthropics/claude-code-action/docs/setup.md` (official, current):
*"Or `CLAUDE_CODE_OAUTH_TOKEN` for OAuth token authentication (Pro and Max
users can generate this by running `claude setup-token` locally)."*

## Why the original assessment missed it

`appearance-discovery.yml`, the one existing workflow in this repo that
calls Anthropic, uses `ANTHROPIC_API_KEY` — that's the only precedent the
first pass checked, and it generalized from one example instead of reading
`claude-code-action`'s own setup docs for the auth options it supports.

## The token, concretely

- Generated once by running `claude setup-token` from an interactive Claude
  Code session logged into the target account. This is a **long-lived
  token built specifically for automation — approximately one year of
  validity** — distinct from the short-lived (8–12 hour) token `/login`
  produces for interactive sessions. It will not need daily refreshing.
- Stored as a normal GitHub Actions repository secret,
  `CLAUDE_CODE_OAUTH_TOKEN`, exactly like `ANTHROPIC_API_KEY` is today.
- Every `routine-*.yml` workflow's `claude-code-action` step swaps
  `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}` for
  `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}` — a
  one-line change per workflow, no other part of the mapping in the
  original assessment changes.

## The honest remaining catch — read before committing

This is not a free lunch, it is a **different, non-monetary cost**, and the
assessment would be dishonest if it didn't say so plainly:

**The token draws from the same plan-usage pool Joey's own interactive
Claude Code sessions use.** Anthropic pools the 5-hour rolling session
window and the 7-day weekly cap across every surface tied to the account —
Claude Code CLI, claude.ai, Claude Desktop, and now GitHub Actions runs
authenticated with that account's token. Anthropic no longer publishes
fixed token/hour figures for these caps (Pro vs. Max 5x vs. Max 20x are
described only as relative multipliers), so the honest statement is:
**~15 scheduled runs/day of mixed Opus/Sonnet/Haiku will consume a real,
currently-unmeasured slice of Joey's own daily/weekly Claude Code
headroom**, the same headroom he uses for interactive coding work through
Hermes and Claude Code sessions. If the fleet is heavy enough relative to
his plan tier, the failure mode shifts from "$1.5–4k/yr surprise bill" to
"Joey's own interactive Claude Code session gets rate-limited because the
routine fleet burned the shared weekly cap" — a worse outcome operationally,
even though it costs $0 extra.

Mitigations available if that happens, in order of preference:
1. Route routines to Sonnet/Haiku wherever the prompt doesn't need Opus —
   already partially done per the runner registry's model-tiering table.
2. Spread schedule times so routines don't cluster inside Joey's own
   working hours, reducing same-window contention.
3. If the fleet genuinely doesn't fit even after tiering, that account
   still has the `ANTHROPIC_API_KEY` fallback per-workflow (mix and match —
   heavy/frequent lanes on the key, light/infrequent ones on the token) —
   this is a dial, not an all-or-nothing choice.
4. Upgrading the plan tier (Max 5x → Max 20x) is itself a >$100/yr
   recurring-cost decision and would need its own founder sign-off if it
   comes to that — not assumed here.

## Revised Decision D1 — authorise the pilot (no new metered spend)

- **A — pilot two routines on Actions using `CLAUDE_CODE_OAUTH_TOKEN`, 3
  days (recommended):** Marjorie's 6 AM brief (Opus, the noisiest) and
  Laura's a11y walk (Sonnet, the quietest), run in parallel with the
  claude.ai originals. Measure actual plan-usage impact via `/usage`
  before and after, not a token-cost estimate — the pilot answers a
  headroom question, not a money question, because there is no money
  question anymore. Cost: **$0** (draws plan allowance, not billed
  tokens). Reversible: yes — delete two workflow files, or just don't
  merge them.
- **B — migrate the whole fleet now on the OAuth token:** fastest end to
  the human-action stream (#10, #11, #35, #37, #38, #41-class items all
  disappear at once); skips measuring whether 15 routines/day fits inside
  Joey's plan headroom before every routine depends on it. Reversible:
  yes (re-enable the claude.ai triggers, left disabled not deleted).
- **C — stay on claude.ai routines:** zero change, the human-action stream
  continues, `SYNC-T20`-style prompt-drift docs remain the workflow.
- **Recommendation: A.** The only unknown left is whether the fleet's
  total token draw fits comfortably inside Joey's plan alongside his own
  interactive use — a 3-day pilot with a before/after `/usage` reading
  turns that into a fact in three days, at zero cost either way.
- **Reply with:** `D1=A`, `D1=B`, or `D1=C`.
- **Then Hermes will:** on A or B — (1) open the kanban card(s) to add
  `claude_code_oauth_token` support to the reusable `routine.yml` template
  from the original migration plan, (2) file the one human-only step below,
  (3) stand up the pilot workflow file(s) and the CI test replacing the
  Routine Auditor, gated behind the token existing as a repo secret; on C,
  close this card, no further action.

## The one genuinely human step (unchanged in kind, cheaper in practice)

Generating `claude setup-token` requires an interactive login to Joey's own
Claude account from a terminal — no agent can do this on his behalf, the
same way no agent could touch `RemoteTrigger`. Concretely:

1. Joey runs `claude setup-token` from any machine where he can log into
   his Claude account (his laptop, or a `claude` session on this server if
   he's logged in there) — this is a ~1-minute interactive prompt, not a
   development task.
2. He pastes the resulting token to Hermes over a private channel (not a
   repo PR, not a public comment), and Hermes sets it as the
   `CLAUDE_CODE_OAUTH_TOKEN` repository secret via `gh secret set` — the
   same mechanical step already used for `ANTHROPIC_API_KEY`.
3. This replaces, not adds to, the previously-scoped `/install-github-app`
   step from the original assessment — installing the app is still needed
   once, independent of which auth method backs it.

No new spend, no new irreversible action — this is the same class of
one-time credential setup as the existing `ANTHROPIC_API_KEY` secret, just
tied to the plan instead of the metered key.

## Sources checked

`anthropics/claude-code-action/docs/setup.md` (main branch, current —
official OAuth token auth path), `anthropics/claude-code-action` GitHub
issue #727 (documents the short-lived `/login` token vs. long-lived
`setup-token` distinction and its ~1-day expiry pitfall if the wrong token
source is used), third-party `setup-token` walkthroughs confirming the
~1-year automation-token lifetime, Anthropic's own usage-limit help
articles (5-hour rolling window + 7-day weekly cap, pooled across Claude
Code/claude.ai/Desktop, no fixed published figures as of this pass — read
`/usage` for the live number instead of quoting a memorized figure), and
`docs/audits/2026-09-05-claude-routines-relocation-assessment.md` (the
document this one revises).
