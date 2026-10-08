# Tree Overhaul — founder runbook

You run this. Each wave is one fresh session. Clear between waves. The
prompts are in `waves/`; paste them whole. Times are agent wall-clock; you
are mostly waiting or reviewing behavior, not diffs.

## The rhythm for every wave

1. **Start.** In Swift2, type `/clear`, then set the model the table says
   (`/model sonnet` or `/model opus`). Paste the wave's prompt from `waves/`.
2. **Walk away.** The session works in worktrees, opens PRs, reviews, and
   merges its own PRs after confirming real CI. It stops for exactly two
   things: a founder-only action (marked **YOU:** in its messages) or a
   genuine spec gap. Answer in chat; the answer is the decision.
3. **Gate.** When it reports the wave done, ask one question: "List each
   gate from PLAN.md for this wave and the command output that proves it."
   Anything answered with "the agent said" is not done. Send it back.
4. **Close.** Say "checkpoint and stop." It updates `STATE.md` and ticks the
   wave on #4117. Then `/clear`.
5. **If it hits a limit warning**, it invokes the `pause` skill. Come back
   after the reset, `/clear`, paste the same wave prompt, and say "resume from
   PAUSE.md".

## Schedule (aggressive)

| When | You do | Session model | Duration | Then |
|---|---|---|---|---|
| **Thu 09-11, now** | `/clear` → paste `waves/wave-2-unblock.md` | Sonnet | 2–3h | Two **YOU** steps will surface: react ✅ on the #4108 brief in #longlive-tree when asked; flip `SOCIAL_FREEZE` to `false` in GitHub → Settings → Secrets and variables → Actions → Variables when it reports the gate proven. |
| **Thu evening or Fri 09-12 morning** | `/clear` → `/model opus` → paste `waves/wave-1-design.md` | Opus | 2–3h | It opens one docs PR with 7 specs + decisions entries and stops. |
| **Fri 09-12 midday, 30 min** | Read each spec's "Behavior you will see" section only (they are written for you). Reply in chat: "approved" or what to change. | same session | 30 min | It merges the docs PR. `/clear`. |
| **Fri 09-12 afternoon → Sat** | `/clear` → paste `waves/wave-3-loop.md` | Sonnet | ~1 day agent time | **YOU:** one Discord reaction test at the end (a ❌ with a reply on a synthetic brief). |
| **Sun 09-14 → Mon 09-15** | `/clear` → paste `waves/wave-4-metrics.md` | Sonnet | 1–2 days | **YOU:** Instagram/X API access may need your login (it will write `HUMAN-ACTIONS.md` entries with exact steps). |
| **Mon 09-14 ~09:00 PT** | Nothing. R1 recheck fires by itself and comments on #4117. Read the comment. | — | 5 min | If the comment includes a "Follow-up session prompt" block, run it (Opus). |
| **Mon 09-21** | R2 recheck. Also your first real Tree strategy brief in #longlive-tree. Reply in its thread. | — | 15 min | Same follow-up rule. |
| **Thu 10-02** | R3 recheck. | — | 5 min | Same. |
| **Thu 10-16** | R4 recheck proposes closing the plan or extending it. | — | 15 min | Decide in a comment on #4117. |

You can compress this: Waves 2 and 1 can run back to back the same day. Wave 3
needs Wave 1 approved. Wave 4 needs Wave 3 merged. Do not run two waves
concurrently in the same checkout; a second session in the same repo caused a
collision on 09-10.

## Your standing job once it is live

- **Approving posts.** ✅ approve. ✏️ approve-with-edit: reply to the brief
  with the exact caption you want. ❌ reject: reply to the brief with one
  sentence of why. No reply = the poll waits and the daily digest asks you.
  The reason is the product here; a bare ❌ teaches nothing.
- **Monday brief.** Tree posts it in #longlive-tree. Reply in the thread
  by Wednesday and the current week re-plans; later and it shapes next week.
  React ✅/❌ on each numbered proposal.
- **Reddit prompts.** ✅ when you replied, ⏭️ to skip.
- **Watch #4117.** Recheck reports land there. Each says "on track" or gives
  you a prompt to paste.

## What the models are for

- **Sonnet** runs waves 2–4 as orchestrator; executors do the code. Cheapest
  per unit of mechanical work, and everything mechanical is spec'd already.
- **Opus** designs (Wave 1), runs the rechecks, and takes any follow-up that
  changes the plan. Also the debug-protocol owner if the e2e Track Guide bug
  fights back.
- **Fable** is optional in Wave 1: the prompt asks for one read-only
  `architect` review of the specs before you read them. Skip it if the
  weekly floor is spent.
- **Codex** reviews every PR that touches the poller, stamper, poster or gate.
  Two rounds max; a third means the approach is wrong.

## Concurrency authorization

The wave prompts state "the owner authorizes up to 6 concurrent subagents
for this session." That is you saying it, via this runbook, on 2026-09-11.
Parallel agents bill concurrently against the plan window; if the statusline
shows the limit climbing fast, tell the session "drop to 3 concurrent."
