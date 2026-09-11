# T7 — The autonomy ladder

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 4 build)
**Depends on:** S3 (the ledger is the only evidence), T4 (proposals are how a grant is made), T5 (a revocation becomes a lesson).
**Carries the one open question in this wave** — see the end.

---

## Behavior you will see

Nothing, for a long time. On day one nothing is eligible and nothing changes.

Once a *kind* of post has earned it — say the "on this day" heartbeat: eight or more briefs over four weeks, you approved every one with a plain ✅, never edited one, never rejected one — Monday's brief carries a proposal:

> **Proposal 1 — let me post "on this day" without waiting for you**
> 11 briefs in 4 weeks, 11 plain ✅, 0 edits, 0 rejections. I'd post these
> on schedule and tell you in the channel afterwards. Everything else keeps
> waiting for you. ✅ to grant, ❌ to leave it as it is.

If you ✅ it, posts of that one kind go out on schedule, and you get a message afterwards saying so, with the link. If you ❌ that message within 24 hours, **that kind of post goes straight back to needing your approval** and Tree writes down why.

**Read this part carefully: ❌ after the fact does not delete the post.** Instagram has no delete in its API at all — confirmed, not a limitation we can engineer around. Tree will delete the X post automatically and give you the exact two-tap steps to remove the Instagram one by hand, but for some minutes or hours it was public. Approving a grant means accepting that.

You can revoke any grant at any time by saying so. There is no appeal and no re-earning period shorter than another four clean weeks.

---

## Data

### `social/autonomy.json`

```jsonc
{
  "v": 1,
  "grants": [
    {
      "type": "heartbeat:on-this-day",
      "status": "active",                 // "active" | "revoked"
      "grantedAt": "2026-10-14T10:12:00Z",
      "grantedBy": "discord:338508192755482626",
      "proposalPr": 4190,
      "proposalMessage": "1419...",
      "evidence": { "briefs": 11, "approved": 11, "edited": 0, "rejected": 0, "windowStart": "2026-09-16", "windowEnd": "2026-10-14" },
      "revokedAt": null,
      "revokedReason": null,
      "revokedMessage": null
    }
  ]
}
```

`type` is a **campaign family** as defined in `docs/marketing/social-strategy.md` §1 — the value `pillarOf(campaign)` returns (S3). Grants are per family, never per campaign (a campaign value is story-unique and used once, so a per-campaign grant could never accumulate evidence) and never global. There is no "all posts" grant and the schema cannot express one.

Revoked grants stay in the array forever. Re-granting appends a new entry; it never edits the revoked one.

### Eligibility

Computed from `social/feedback/*.jsonl` alone, over the trailing **28 days**, for one `type`:

| Condition | Threshold |
|---|---|
| briefs of this type resolved | ≥ **8** |
| plain ✅ share | ≥ **95%** |
| edits (✏️) | any number, subject to the 95% |
| rejections (❌) | **exactly 0** |
| existing active grant | none |
| `SOCIAL_FREEZE` | not set |

At ≥8 briefs, 95% permits **zero** edits at n=8..19 and one at n=20 — deliberately: "95%" at these sample sizes means "no exceptions", and the stricter of the two conditions is the one that binds. A single ❌ disqualifies regardless of rate, because a rejection is categorically different from an edit: an edit says "nearly right", a rejection says "don't post this".

Eligibility is necessary, not sufficient. It only permits Tree to *propose*. **Only a founder ✅ on a T4 proposal creates a grant**, and only through that path.

### The policy stamp — approval schema `v: 3`

`approvalStatus` today requires `approval.by` to match `/^discord:\d{17,20}$/` and to be in `SOCIAL_APPROVERS`. A policy approval is not a Discord identity and **must not be added to `SOCIAL_APPROVERS`** — `approvers.test.ts` asserts that list is non-empty and disjoint from automation identities (B5), and the whole point of B1 is that it contains only identities no automation holds. So the schema gains a version and a kind:

```jsonc
"approval": {
  "v": 3,
  "kind": "policy",                                   // "founder" | "policy"
  "by": "policy:heartbeat:on-this-day@2026-10-14",
  "at": "2026-10-21T14:59:02Z",
  "pr": 4230,
  "message": "1421...",
  "contentHash": "sha256:…",
  "sig": "hmac-sha256:…"
}
```

`by`'s policy form is `policy:<type>@<grant date>`, matching `/^policy:[a-z0-9:._-]+@\d{4}-\d{2}-\d{2}$/`.

**The signature payload becomes version-aware, and this is load-bearing:**

| `v` | payload |
|---|---|
| 2 | `${v}\|${by}\|${at}\|${pr}\|${contentHash}` — unchanged, so every existing stamp keeps verifying |
| 3 | `${v}\|${kind}\|${by}\|${at}\|${pr}\|${contentHash}` |

`kind` must be signed. If it were not, a `v: 3` record could be assembled from a founder stamp's signed fields and relabelled `kind: "policy"`, or the reverse — a policy stamp presented as a founder approval, which is exactly the distinction the ledger and the ladder both depend on.

`approvalStatus` for `kind: "policy"` requires **all** of: a valid `v: 3` signature · `by` matching the policy form · a grant for that type with `status: "active"` in `social/autonomy.json` · the grant's date matching the one in `by` · the item's `pillarOf(campaign)` equalling the grant's `type` · `contentHash` matching. Any failure is an ordinary invalid approval and the poster refuses the item exactly as it does today.

`kind: "founder"` is required on every `v: 3` founder stamp, and `v: 2` records are still accepted — no migration, no grandfathering hole, since a `v: 2` record still has to satisfy the original Discord-identity checks.

### The "posted under policy" notice

Posted by `social-poster.yml` through the same webhook, immediately after a successful post:

```
**Posted under policy — heartbeat:on-this-day**
Went out just now on X and Instagram. You granted this on 14 Oct.
<link to the X post> · <link to the Instagram post>

React ❌ in the next 24h to pull this type back to needing your approval.
That won't delete the Instagram post — Instagram has no delete API — but
I'll delete the X post and give you the steps for Instagram.
ref: PR #4230 · <sha> · posted:heartbeat:on-this-day
```

A `posted:<type>` scope token (S3's table) with ❌ — and, exceptionally, **no reply required**. Everywhere else a ❌ needs a reason before anything happens; here the thing that matters is already public and the priority is stopping the next one. The poll revokes immediately on the bare ❌ and then *asks* for the reason via the standard nudge, recording it against the revocation when it arrives.

### Revocation

On ❌ within 24h of the notice (measured from the notice message's timestamp):

1. Set the grant `status: "revoked"`, with `revokedAt`, `revokedMessage`, and `revokedReason: null` until the reply lands.
2. Every unposted queue item carrying a policy stamp for that type has its `approval` **removed** and returns to the gate. (Removing it is correct: the stamp's authority came from a grant that no longer exists.)
3. Write a T5 lesson, `Times fired: 1`, titled for the type, with the notice and the reply as evidence.
4. Retract what can be retracted:
   - **X** — delete via `DELETE /2/tweets/:id`. Not implemented today; new work in `scripts/social/lib/platforms.mjs`.
   - **Facebook** — `scripts/social/delete-media.mjs` already does this, invoked by the workflow. (Agents still may not run it by hand — that guard denial stands.)
   - **Instagram** — **impossible.** The Graph API rejects delete on published media with code 100 / subcode 33 regardless of token permissions (confirmed 2026-07-17, `delete-media.mjs` header). Tree files a `founder-task` issue with the post link and the exact in-app steps.
5. Post one message in the channel confirming what was and was not retracted. Never imply the Instagram post is gone.

A ❌ **after** 24h revokes the grant but triggers no retraction — at that age deleting a post is a bigger event than leaving it, and it is the founder's call, not Tree's.

### Everything else

An item whose type has no active grant behaves exactly as it does today: no stamp, a Discord brief, a founder ✅/✏️/❌, then merge and post. The ladder adds a path; it removes nothing.

---

## Mechanics

- **`scripts/social/lib/queue.mjs`** — `approvalSigPayload` version-aware; `approvalStatus` handles `kind`; `signApproval` unchanged in shape.
- **`scripts/social/lib/autonomy.mjs`** (new) — `readGrants`, `activeGrantFor(type)`, `eligibility(ledgerRows, type, now)` → `{ eligible, briefs, approvedPct, rejected, reason }`, `grant(...)`, `revoke(...)`. Pure, unit-tested.
- **`scripts/social/stamp-approval.mjs`** — a `stampUnderPolicy(files, {type, grant, key, pr, message})` path, refusing unless `activeGrantFor(type)` returns a grant and every file's `pillarOf(campaign)` matches it. Same belt-and-braces posture as the existing `SOCIAL_APPROVERS.includes(by)` check: it does not trust its caller.
- **`scripts/social/social-approval-poll.mjs`** — on seeing a draft PR whose every queue item is covered by an active grant, stamp under policy and merge without waiting for a reaction; handle `posted:<type>` ❌ (revoke, unstamp, retract, lesson); handle `proposal:<n>` ✅ that carries an autonomy proposal (write the grant).
- **`.github/workflows/social-poster.yml`** — post the "posted under policy" notice for any item with `approval.kind === "policy"`.
- **`.github/workflows/social-retract.yml`** (new) — invoked by the poll on revocation; holds the platform credentials, performs X and Facebook deletion, files the Instagram `founder-task`.
- **`scripts/social/weekly-scorecard.mjs`** — an `eligibility()` block in the Monday brief listing every type's standing (`heartbeat:on-this-day — 11/11, eligible` / `mood:chip-poll — 4 briefs, needs 8`), so the ladder's state is visible every week whether or not anything is proposed.
- **`docs/agents/runner-prompts/tree-weekly-plan.md`** — propose at most **one** autonomy grant per week, even when several types qualify. A week that hands over three categories at once is not a ladder.

---

## Why the human gate remains the default

Not caution, and not sequencing — four specific reasons:

1. **The gate is cheap and the failure is not.** One tap on a phone costs the founder seconds. A bad post on a fan account is seen by the exact audience the account exists to keep, and — on Instagram — cannot be taken back by any automation. The expected costs are not close.
2. **Approval rate measures agreement, not judgment.** Eleven consecutive ✅s on "on this day" posts say the format is safe and Tree is competent at it. They say nothing about how Tree behaves the week Taylor is in the news for something the blocklist covers — which is precisely the week the gate earns its keep, and precisely the week the trailing-28-day statistic is least informative.
3. **The identity argument runs one way.** B1 exists because GitHub could not distinguish the founder's tap from an agent's. Discord can. A policy stamp deliberately gives that distinction up for one narrow class of post. Every such class is a small permanent reduction in what the ledger can prove about who approved what, and it should be spent deliberately, one at a time.
4. **Zero users is the wrong moment to optimise the gate.** The gate is not the bottleneck on a fan account with no audience; the quality of the writing is. T2 and T5 attack the bottleneck. T7 attacks the ceremony, and ceremony is not what is costing us anything right now.

So: eligible does not mean granted, a grant is one type, one grant per week, and the default for everything else is unchanged forever.

## What would make me rule this out

Two conditions. One is met, one is not:

- **If a bad autonomous post could not be retracted at all, by anyone.** This *nearly* fires. Instagram has no delete API. It survives only because a human can still delete the post in the app in about ten seconds — so the 24h ❌ degrades to "Tree deletes X, hands you two taps for Instagram" rather than "nothing can be done". If that manual path did not exist, I would recommend against the ladder outright.
- **If the evidence could be produced by anything other than the founder.** It cannot: eligibility reads only `social/feedback/` rows, which are written only from Discord reactions by `SOCIAL_APPROVERS` ids that no automation holds. If a future change ever let an agent write a ledger row, this ladder must be switched off in the same PR. That is stated here so the dependency is discoverable from the thing that depends on it.

I would also rule it out if anyone proposed a **global** grant, a grant with **no** revocation path, or eligibility over a window **shorter than 28 days**. None of those are in this design and the schema cannot express the first.

---

## Acceptance criteria

1. `eligibility()` returns `eligible: false` for: 7 briefs at 100% · 8 briefs with 1 ❌ · 8 briefs with 1 ✏️ (fails 95% at n=8) · any type while `SOCIAL_FREEZE` is set · a type with an existing active grant.
2. `eligibility()` returns `eligible: true` for exactly 8 briefs, 8 plain ✅, 0 ✏️, 0 ❌ in the window.
3. On day 0, with an empty ledger, the eligibility check runs and returns "not eligible" for every one of the six campaign families — no crash, no empty output. *(This is the Wave 4 gate in `docs/plans/tree-overhaul/PLAN.md`.)*
4. `approvalStatus` accepts a `v: 3` `kind: "founder"` record and a `v: 2` record; it rejects a `v: 3` record whose `kind` was altered after signing.
5. `approvalStatus` rejects a `kind: "policy"` record when: no grant exists · the grant is revoked · the grant date in `by` does not match · the item's campaign family differs from the grant's type · the signature is invalid.
6. `stampUnderPolicy` refuses to write anything when handed a file whose campaign family does not match the grant.
7. A ❌ on a `posted:<type>` notice within 24h: revokes the grant · removes the policy `approval` from every unposted item of that type · creates a T5 lesson · dispatches the retraction workflow. **No reply is required for any of it.**
8. A ❌ on the same notice at 25h revokes the grant and dispatches **no** retraction.
9. The retraction workflow deletes the X post, deletes the Facebook post, and files a `founder-task` for Instagram containing the post URL and the in-app steps; its channel message does not state or imply that the Instagram post was removed.
10. The weekly brief lists every campaign family's ladder standing, whether or not anything is eligible.
11. The Monday run proposes at most one grant in a week in which three types qualify.
12. With no `social/autonomy.json` present at all, the poll, the poster and the checker all behave exactly as they do today (the file's absence is the day-0 state and must not be an error).

---

## Files affected

| Path | Change |
|---|---|
| `social/autonomy.json` | **new** — absent until the first grant |
| `scripts/social/lib/autonomy.mjs` | **new** |
| `scripts/social/lib/queue.mjs` | `v: 3`, `kind`, version-aware signature payload |
| `scripts/social/stamp-approval.mjs` | `stampUnderPolicy` |
| `scripts/social/lib/platforms.mjs` | X post deletion |
| `scripts/social/social-approval-poll.mjs` | policy stamping, `posted:<type>` ❌, grant writes |
| `.github/workflows/social-poster.yml` | the "posted under policy" notice |
| `.github/workflows/social-retract.yml` | **new** |
| `scripts/social/weekly-scorecard.mjs` | the ladder standing block |
| `docs/agents/runner-prompts/tree-weekly-plan.md` | one proposal per week |
| `docs/agents/tree.md` | the ladder as a stated, revocable exception to the gate |
| `social/README.md`, `docs/social/pipeline.md` | `v: 3` schema |
| `tests/` | eligibility boundaries, `v: 2`/`v: 3` verification, policy rejection cases, revocation |

---

## Open question — the one in this wave that is yours

**Do you accept that a post approved by policy may be irrevocably public on Instagram?**

Everything else in these seven specs is reversible by a code change. This is not, because it is not really a code decision: on any day a grant is active, an autonomous Instagram post can go out that neither Tree nor any workflow can delete. The 24h ❌ stops the *next* one and hands you two taps to remove that one by hand. That is the whole of the mitigation.

If the answer is yes, T7 ships as written. If it is no, the honest alternatives are:

- **(a) Ship T7 X-only.** Currently impossible: X+Instagram pairing is mandatory with no exceptions (`checkCampaignPair`, 2026-08-26), so there is no X-only campaign to grant. It would take a founder decision to reopen pairing, and pairing exists for good reasons.
- **(b) Don't ship T7.** Keep the gate universal and spend the effort on T2/T5, which improve what gets written rather than who waves it through. **This is what I would choose if the mitigation above does not satisfy you** — the ladder's value at zero users is small, and it is the one item in this wave whose worst case is not undoable.

I have specified it fully so the choice is between two finished things, not between a plan and a shrug.
