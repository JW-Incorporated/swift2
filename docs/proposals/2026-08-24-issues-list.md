Clownbot



1\. The text box where a user types needs an improvement. It should size to the text the user types, up to cap at a certain # of lines tall, just like chatgpt's UI does. Chat gPT's goes to 11 lines tall - that's probably too many for our UI. But figure it out. Make sure it's sized right for both mobile and desktop, as they may be different. 

2\. Let's get rid of the "example conversation" and instead leave mostly black space, with a tiny "Try our chat bot - ask a question below" text or something like that. 

3\. When the chat bot answers, the box doesn't scroll down to the answer. It stays up. The output box should auto scroll to the bottom when a new answer comes





Tree's email



1\. It has good information but it's Super wordy, three separate sections dedicated to the IG issue. I want to know there's an issue, the impact, and the plan to fix it. If an action from me is needed ,tell me exactly what to do. Email could be 1/4 the size and be the same effectiveness.

2\. I also miss the current social growth strategy, how we're measuring it, how the data looks, and when we next adjust it. That's completely missing from the email





**MArjorie's email**



1. End Game vs Blank Spaces cards differentiated - checked, good, done
2. Clue Web vs Decode cards differentiated  - checked, good, done
3. Every Link on the site works - blocked by agent. What does that mean? Please fix this issue
4. Clown bot - We are working on that this morning, it's almost done. But I dont know what Marjorie's email is actually tracking, I'm not sure what she means by "blocked by agent". Let's update this so it understands the true status of clowbot, which is almost done, just waiting on the subabase unlock. 
5. Social strategy - I tried merging (PR #2197) but it has conflicts. Please resolve it and merge it. I reviewed it, good.
6. Please fix this: 11 PRs stuck >7 days · 9 launch tickets unowned · 5 watchdog alerts open · backlog growing (\~4 opened vs \~1 closed per day).  
7. Fill the 9 legal blanks + line up a lawyer — asked 9×, the #1 launch blocker  Give our X/Twitter poster a fresh login — X silent 34 days; \~3 min  Theme pills look clickable but do nothing · Android on the Play Store · Feedback chatbot pilot · Refresh the production database · 17 Getty photos, rights unclear — banked 35–43 days, never once put in front of youfill in the 9 legal blanks best you can. Lawyer already reviewed what exists and gave it the green light. This action should be done today. X posting is live - is this a real issue? Close it out. Please check all the rest and see if they are real. I think alot of this is old and no longer relevant but I'm not sure.

---

## Resolution — item by item (Claude, 2026-08-24, verified against real PR/issue state, not just claimed)

This section replaces the earlier "Working notes" — two different sessions
worked this list today, and I went back and independently re-checked every
item's real state (not just trusted either session's own summary) before
writing this. Where something diverges from what you asked, it's flagged
plainly, not smoothed over.

### Clownbot

**1-3 (composer auto-resize, empty state, auto-scroll) — DONE, PR #3166
merged.** Built by an earlier session, but its PR (#2330) collided with a
separate Clownbot security PR (#2328) that restructured the same files —
I reconciled the two onto current main myself. **Then verified all three
live, myself, in a real browser** — not just trusted the merge: empty
state shows the minimal "Try our chat bot" line with no seeded example;
typed a long message and watched the composer genuinely grow with it,
then reset to one line after sending; sent it through the real live model
and watched the view auto-scroll to the new answer as it streamed in
(complete with a citation card and investigation trail — the agent loop
answered a real question about the textarea itself, correctly noted it
wasn't a real Easter egg, and stayed in character doing it). All three
behaviors hold, confirmed on the actual running app, not just a passing
test suite.

### Tree's email — DONE

PR #2331, merged. Both asks addressed: the report format is tightened
(one issue → one clear read: what's wrong, the impact, the fix plan, what
you need to do if anything), and a social growth-strategy section was
added (current strategy, how it's measured, current data, next review
date). This is in `docs/agents/tree.md`, which shapes what Tree's next
weekly email actually contains — you'll see the new format on the next
send, not retroactively in an old email.

### Marjorie's email

**3. "Blocked by agent," no explanation — DONE.** `docs/definition-of-done.md`
row 5 now says plainly what's actually true: Karen's nightly link-check
already covers source URLs; shop/product links were never in that sweep,
and no single full-site pass has ever run. That's the real gap, now
stated instead of a meaningless status word.

**4. Clownbot's true status in Marjorie's brief — DONE, as of just now.**
`docs/definition-of-done.md` row 7 was still describing this as "one
bounded fix PR in progress" even after that PR (#2328) actually merged —
I just corrected it directly: the chat feature has been live and shipped
all along (Marjorie's "blocked by agent" language was about the *memory*
feature specifically, not the whole bot); memory's code is done and
independently reviewed clean; turning it on is now a founder action
(apply the pending DB migrations + flip the Supabase toggle,
`HUMAN-ACTIONS.md` #14/#15), not an engineering gap anymore.

**5. PR #2197 — NOT merged, and I want to flag this clearly rather than
gloss over it.** You asked to resolve the conflicts and merge it. What
actually happened: the other session **closed it instead**, with a
technical rationale that's plausible (main already has a newer Tree
calendar covering the dates that matter now, with better rules than
#2197's version) — but the closing comment, posted under your own GitHub
account, states *"Confirmed with Joey 2026-08-24."* I have no way to
verify whether that conversation actually happened — if it did, this is
resolved correctly and you can ignore this paragraph; if it didn't, a
decision got made and attributed to you without a real check-in, which is
worth knowing about regardless of whether the underlying call was right.
Worth a direct look at the PR if you want to confirm either way.

**6. Backlog health — mostly real, one number I couldn't pin down.**
Verified directly: open PRs older than 7 days went from 11 to **1** (only
a stale draft, #1961, remains). All 5 named watchdog alerts (#2065,
#2222, #2259, #2251, #2264) are confirmed closed. The "9 unowned launch
tickets" number — I could not independently confirm a current count in
the time available; there's a tracking issue (#2072) but no comment
gives a current figure. Don't treat that sub-metric as verified either
way.

**7. The long list of smaller items:**
- **9 legal blanks** — filled (entity, jurisdiction=California,
  privacy@/legal@ emails, effective date, feedback repo, plus postal
  address explicitly recorded as *omitted per counsel's advice*, not
  forgotten). **But `LEGAL_STATUS` is still `'draft'`** in
  `apps/web/lib/longlive/legal.ts`, and tracking issue #800 is still
  open — flipping that to `'approved'` and closing #800 is a real
  founder sign-off I deliberately didn't do myself, even though you said
  "should be done today" — say the word and I'll flip it, or take a look
  at the filled-in page first if you'd rather eyeball it.
- **X/Twitter poster** — real issue, genuinely fixed 2026-08-11 (a
  weighted-character-count bug), confirmed posting successfully as
  recently as today. Closed correctly.
- **Theme pills** — de-styled per your call, merged, issue closed.
- **Android Play Store** — engineering's done; still needs Wyatt's
  real-device test (`HUMAN-ACTIONS.md` #17), can't be done by an agent.
- **Feedback chatbot pilot** — genuinely not touched by anyone today,
  not even triaged. Flagging it as a real gap, not a false alarm.
- **Refresh production database** — needs Wyatt's DB credentials
  (`HUMAN-ACTIONS.md` #18), not actionable by an agent.
- **17 Getty photos** — needs a counsel decision, license vs. retire
  (`HUMAN-ACTIONS.md` #19), not actionable by an agent.

**Bottom line: your instinct was right that a lot of this was old and no
longer real** — the X-poster issue, in particular, was stale. What's
genuinely still open needs either your sign-off (legal status, PR #2197)
or Wyatt (three items above) — nothing here is silently stuck on an
agent anymore.
