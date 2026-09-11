# Wave 5 — The autonomy ladder, acting half

**Do not start this wave until all three entry gates hold.** They are in
`PLAN.md` under "Gates"; restated here because this is the one wave that
changes *who may approve a post*:

1. **Checkpoint R4 (2026-10-16) reports at least one campaign family at or
   within two briefs of eligibility.** If nothing is close, this wave does not
   run — that is a success, not a delay.
2. **`DELETE /2/tweets/:id` has been exercised successfully against a real
   throwaway post.** Not "the API docs say it works" — an actual delete, with
   the run linked in this wave's first PR. If X delete cannot be made to work,
   stop and escalate: the mitigation for a bad autonomous post would then be
   "nothing can be retracted on either platform", which is a materially
   different decision from the one the founder made on 2026-09-11.
3. **The founder has re-confirmed, at that time, that they accept an
   irrevocably-public Instagram post.** The 2026-09-11 approval is not
   sufficient on its own. Ask plainly, in chat, and record the answer on
   #4117 before writing any code.

Model: **Opus**. Codex review is **mandatory on every PR in this wave**, not
conditional on which files changed.

Paste everything below this line into a fresh Opus session in Swift2.

---

You are executing Wave 5 of the Tree Overhaul (`docs/plans/tree-overhaul/PLAN.md`, epic #4117).

**Confirm the three entry gates above yourself before doing anything else** — read R4's recheck report, find the X delete proof, and confirm the founder's re-confirmation is recorded on #4117. If any is missing, stop and say so. Do not proceed on the strength of the 2026-09-11 approval alone.

Read `PLAN.md`, `docs/specs/tree-overhaul/t7-autonomy-ladder.md` in full, the amended T7 entry in `docs/decisions.md` (2026-09-12), `docs/social/RULINGS-SOCIAL-2.md` (B1 and B5), and `scripts/social/lib/queue.mjs`'s `approvalStatus`, `approvalSigPayload` and `contentHashPayload`.

Same hard rules as every wave: never discard uncommitted work (the destructive git commands on the human-only list in `CLAUDE.md`); never run `post-queue.mjs` or `delete-media.mjs` by hand; never hand-write an `approval` object; never merge a `social/queue/**.json` PR; you confirm real CI yourself with `gh pr checks` before merging, never an agent's local claim; `gh secret` / `gh variable` mutation is human-only → `HUMAN-ACTIONS.md` with exact literal steps. Branch per task, in a worktree outside `Documents\Claude\Projects\`.

## Step 0 — re-derive the thresholds from real data (before any code)

The spec's eligibility thresholds — ≥8 briefs, ≥95% plain ✅, 0 ❌, trailing 28 days — were chosen in Wave 1 **with no data behind them**, and the spec says so. By now `social/feedback/*.jsonl` holds four or more weeks of real verdicts.

Compute the actual distribution per campaign family: briefs, ✅/✏️/❌ counts, edit rate, and how each family would have scored against the current thresholds week by week. Then answer in this wave's first PR body: do the thresholds admit anything that should not be admitted, or exclude something obviously safe? Propose changes with the numbers attached.

**A Wave 5 that ships the Wave 1 thresholds unchanged is a sign nobody looked.** If they genuinely survive contact with the data, say so explicitly and show the table.

## The tasks

**A. Signed grants.** `scripts/social/lib/autonomy.mjs` gains `signGrant` / `verifyGrant` — HMAC over `${type}|${grantedAt}|${grantedBy}|${proposalPr}|${proposalMessage}|${status}`, keyed by `SOCIAL_APPROVAL_KEY`, written only by the poll job. `status` is inside the payload, so a revoked grant cannot be flipped back to active by editing the file. `social/autonomy.json` lives on the **`social-ledger`** branch (`main` is branch-protected; nothing can push to it).

**This is the load-bearing security property of the entire wave.** Unsigned, any agent in this repo could write `status: "active"` into that file, and the poll — which holds the key — would then sign a `kind: "policy"` stamp and publish with zero founder involvement. Ship the forged-grant regression test in the same PR as the feature, never as a follow-up.

**B. Approval schema `v: 3`.** Make `approvalSigPayload` version-aware: `v: 2` keeps its exact current payload string (every existing stamp must keep verifying — changing that string invalidates all of them), `v: 3` adds `kind` to the payload. `approvalStatus` handles `kind: "founder"` and `kind: "policy"` and **stays pure** — grants arrive via `options.grants`, never a disk read inside the function, because both the poster and `check-drafts.mjs` call it. `policy:<type>@<date>` must never enter `SOCIAL_APPROVERS`; `approvers.test.ts`'s B5 disjointness assertion must still pass untouched.

**C. Policy stamping and the notice.** `stampUnderPolicy` in `stamp-approval.mjs`, refusing unless an active *and signature-valid* grant exists and every file's `pillarOf(campaign)` matches its type — the same belt-and-braces posture as the existing `SOCIAL_APPROVERS.includes(by)` check, which deliberately does not trust its caller. The poll stamps and merges a fully-covered draft PR without waiting for a reaction. `social-poster.yml` posts the "posted under policy" message carrying a `posted:<type>` ref scope.

**D. Revocation and retraction.** ❌ on a `posted:<type>` notice within 24h, **no reply required** — everywhere else a ❌ needs a reason first, but here the thing that matters is already public and stopping the next one outranks collecting the reason; ask for it afterwards via the standard nudge. Revoke the grant, strip the policy `approval` from every unposted item of that type, write a T5 lesson, and dispatch `social-retract.yml`: delete on X, delete on Facebook, and for Instagram file a `founder-task` carrying the post link and the exact in-app steps.

**The channel message must never state or imply that the Instagram post was removed.** It cannot be. A ❌ arriving after 24h revokes the grant but triggers no retraction.

## Definition of done

Every acceptance criterion in `t7-autonomy-ladder.md` passes. In particular: a hand-written unsigned `social/autonomy.json` grant produces no stamp and no post; `approvalStatus` performs no filesystem access; `eligibility()` returns "not eligible" for everything that has not earned it; and a synthetic revocation produces a channel message that is honest about Instagram.
