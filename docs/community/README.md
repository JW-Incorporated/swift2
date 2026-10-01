# Community Engine — operator's guide

For Joey/Wyatt, not developers. Covers what you'll actually see (an email),
what to do with it, and exactly how to stop any piece of this if something
looks wrong. The engineering spec is
[`docs/proposals/2026-09-06-community-engine-plan.md`](../proposals/2026-09-06-community-engine-plan.md)
(Fable-approved, board `swift2`); this doc is the plain-English companion,
written for card P3-1 (Phase 3, the last build card in that plan).

**The one rule that matters:** nothing here ever posts, comments, replies,
votes, follows, or DMs on Reddit or Facebook by itself. Every piece of text
this system produces is a *draft* — a human (you) always does the actual
posting, by copy-pasting into the site yourself.

---

## 1. What you'll see day to day

**Reply opportunities in Discord** (the same channel as Tree's approvals,
posted under the name **Tree · Reply opportunities**). Twice a day at most
(about 15:36 UTC, plus a later send only for replies to our own comments)
`community-mailer` posts a one-line lead-in ("💬 N reply opportunities")
and then **one message per opportunity**, replies-to-us first, then best
opportunity first. No link previews. Each message is:

```
💬 Reply opportunity · r/<sub>
<thread title>
<thread link>
Why: one line on why it is worth a reply
[the drafted reply, in a code block, ready to copy]
Done? ✅ Posted · Skip   (or react ✅ posted / ⏭️ skip)
```

- **Copy** the code block, edit if you like, paste it yourself.
- **Posted / Skip** links record the outcome (one click, no login) so we never
  suggest the same thread again; the ✅ / ⏭️ reactions feed Tree's feedback
  ledger. Nothing posts automatically.
- A lead the Answerer has not written reply text for is **not sent** (there
  is nothing to copy); it stays queued and is sent once a draft exists.
- Every mailer run logs `webhook target channel_id=… name=…` (never the
  URL) so you can confirm in the Actions log which channel it posts to.
- **Facebook** leads only appear once the Facebook export collector is
  running (it needs the owner's Facebook login); until then only Reddit
  opportunities arrive.

(The older "one email a day" description below is historical; delivery moved
to Discord on 2026-09-09.)

### Awareness replies (picture-only replies, 10+ a day)

Owner direction 2026-10-01 (`docs/strategy/growth-strategy.md`, bet 2): find
Reddit and Facebook threads where a **picture of the site, with no link**,
invites "what is that?!", then explain once someone asks. The system finds the
threads, picks the picture, drafts a short reply and posts the lot to the same
Discord channel under **Tree · Awareness replies**. **You post every reply
yourself** (guardrail 6); nothing posts automatically.

Three times a day (batches around 14:45, 19:45 and 00:45 UTC) a header reads
**🎯 Awareness replies — N today** (N counts today's total, including that
batch), then one message per opportunity:

```
🎯 Awareness reply · r/<sub> · image comments allowed
<thread title>  +  <thread link>
Why: one line on why a picture fits
Image: attached card (era:folklore). Post it with the reply, no link.
Sub rule: that sub's self-promo note
[the reply text, in a code block]
Done? ✅ Posted · Skip
```

The card is **attached as a PNG** (not a link). Paste the reply, attach the
picture, post. No link, no site name in the text: the unexplained picture is
the hook. If someone asks, that is the moment to talk about the site.

How it works, in three workflows (kill switch: repo variable
`AWARENESS_LANE_ENABLED=false`; unset means on):

1. `community-awareness-scan` reads `scripts/community/awareness-subs.json`
   (the subs, a note on each one's self-promo rule, and the caps), scans each
   sub's hot and new feeds, and keeps titles that fit a picture: era
   rankings/debates, timeline questions, Easter-egg/theory threads, nostalgia
   and anniversary threads, news reactions. It skips threads older than 48
   hours, megathreads, crafts and fan art, redline and personal-life topics
   (guardrail 4), NSFW subs, and anything already seen. Caps: 2 per sub per
   run, 4 candidates per sub per day, 8 per run. Recent screened Facebook
   export leads are adopted as awareness rows too.
2. `routine-awareness-answerer` writes the words only. A script
   (`awareness-draft.mjs`) does every read and write: it screens, checks the
   picture id exists, and rejects a reply with a link, a domain, "check out",
   an em dash or more than 300 characters.
3. `community-awareness-deliver` sends at most 7 per batch, 3 per sub per day
   and 20 per day, image-capable subs first. A sub that cannot take image
   comments is labelled **text-only sub** and sent last.

**Image comments per sub.** The scan reads each sub's public `about.json`
(`comment_contribution_settings.allowed_media_types`; `static` means still
images). Reddit blocks that request from CI and from the build environment
(HTTP 403, 2026-10-01), so today every sub reads "image comments unverified
(look for the image icon in the comment box)". To pin a sub, set its
`imageComments` to `"image"` or `"text_only"` in `awareness-subs.json` once you
have seen its comment box. A sub marked `verified: false` there was named from
memory; a missing sub just yields no threads.

**Numbers.** Posted and Skip clicks feed Marjorie's weekly review as
`awareness: {delivered, posted, skipped, open}` (by delivery week); tell
Marjorie in `#longlive-marjorie` how many people replied "what is that?".
Posting an awareness reply does not count toward the 20 non-promo
contributions the link gate waits for (it is promotion, not a plain contribution).

Expect to spend roughly 10–15 minutes on this most days.

### Reddit notification intake

`community-inbox` checks Marjorie's existing inbox every 30 minutes. It does
not depend on a message still being unread: after a verified Reddit message is
handled, it receives a Gmail label named `community-inbox-processed`. That
means opening a Reddit notification in Gmail before the next check cannot make
it disappear from intake.

Messages that fail Reddit sender or DKIM verification remain ignored and never
create a lead. If you want to inspect the intake safely, run
**community-inbox** from GitHub Actions with **dry_run** checked; it reads and
reports eligible messages without writing a lead or changing any Gmail label.

## 2. If you'd rather reply by email than click

Instead of clicking "Posted"/"Skip", you can reply directly to the
Community Tasks email with the plain text `posted <the item's id>` or
`skip <the item's id>` (the id is printed next to each item) — the system
reads that the same way it reads the click. Either method works; use
whichever is easier.

## 3. The fan-theory corpus (the quieter half)

Separately from the daily email, a slow background job reads a year of
public Reddit posts (never Facebook — see §5) from a handful of
Taylor-Swift subreddits and pulls out recurring fan theories (things like
"fans think the next re-record drops in March"). Nothing from this ever
gets posted anywhere. It just makes Clownbot (the site's chat) and the Clue
Web/eggs board able to say "here's what fans are currently theorising,"
citing real threads. You'll never be asked to review or approve individual
theories — the redline filter used everywhere else on the site drops
anything about relationships, identity, or private life before it's ever
stored.

**This is the one piece with a separate on/off switch, because it's the
one piece that reads a real volume of Reddit traffic.** It ships **off**.
See §4.2 to turn it on.

## 4. Turning things on/off (the kill switches)

Everything here uses GitHub repo **Variables** (Settings → Variables →
Actions in the `JW-Incorporated/swift2` repo) — the exact same mechanism
already used for `SOCIAL_FREEZE`. Flipping a variable takes effect on the
*next* scheduled run of that workflow (never mid-run), and every workflow
checks its switch first, before doing anything else — a disabled run shows
up green/instant in the Actions tab, not as an error.

### 4.1 Stop the daily email + drafting (the whole visible half)

Set **`COMMUNITY_SCAN_ENABLED`** to `false`. This stops new Reddit threads
from being picked up for drafting. Nothing already drafted disappears —
leftover drafts just don't get mailed once `community-mailer.yml`'s next
run finds nothing new. To go fully silent immediately, also disable
`routine-community-answerer` and `community-mailer` under the Actions tab
(each workflow has a "..." menu → "Disable workflow").

Reversible any time — flip `COMMUNITY_SCAN_ENABLED` back to `true` and
things resume on the next scheduled run (daily 08:17 UTC for the scan).

### 4.2 Turn ON the year-deep corpus crawl (off by default)

This is the one piece that starts **disabled** on purpose. To turn it on:

1. Go to the repo's **Settings → Secrets and variables → Actions →
   Variables** tab.
2. Set **`COMMUNITY_CRAWL_ENABLED`** to `true`.
3. Optionally set **`COMMUNITY_CRAWL_BUDGET`** to a number — this is how
   many full comment-thread fetches (via your home PC) it's allowed to do
   in one run. It defaults to a conservative 15/run if you don't set it.
   Leave it low (10–20) to run this "a little bit here and there"; there's
   no need to run it at full speed — the plan explicitly favors caution
   over speed here (§8-Q3 of the engineering plan).

The crawl then runs once a day (07:13 UTC). It never touches Facebook (see
§5) and never writes anything to the live site directly — it only stages
raw data for the theory-extraction step, which is what actually produces
the fan-theory rows.

**To turn it back off:** set `COMMUNITY_CRAWL_ENABLED` back to `false` (or
delete the variable — same effect). Takes effect on the next scheduled run;
nothing is left "half-running."

### 4.3 Stop just the fan-theory extraction (leave the crawl running)

Disable `theory-miner.yml` and/or `theory-promote.yml` under the Actions
tab. The crawl keeps collecting raw data (if it's on), it just doesn't get
turned into theory rows until you re-enable these.

### 4.4 Stop everything Community Engine, right now

1. Set `COMMUNITY_SCAN_ENABLED` to `false` and `COMMUNITY_CRAWL_ENABLED`
   to `false` (or delete both variables).
2. Under the repo's Actions tab, disable: `community-scan`,
   `community-inbox`, `community-mailer`, `routine-community-answerer`,
   `community-crawl`, `theory-miner`, `theory-promote`.
3. Nothing is lost — all state lives in Supabase and GitHub, not in any
   running process. Re-enabling any workflow and flipping its variable
   back resumes exactly where it left off (dedupe ledgers prevent
   duplicate drafts/emails on resume).

This does not touch `SOCIAL_FREEZE` (the switch for the site's own posting)
— Community Engine never posts, so there is nothing for `SOCIAL_FREEZE` to
freeze here.

## 5. What this system will never do (guardrails, not settings)

These are not switches because they are not meant to be turned on:
- **Never posts, comments, votes, follows, or DMs** on Reddit or Facebook.
  A human always does the actual posting.
- **Never crawls Facebook.** The only Facebook input is a weekly export
  file *you* save from the browser ("Webpage, Complete") and hand to the
  system — there is no Facebook bot, relay, or API call, ever
  (`docs/decisions.md`, 2026-08-11).
- **Never stores a comment body or a real Reddit/Facebook username** —
  authors are hashed before anything is written, and only our own
  aggregate summary of a post/thread is kept.
- **Never stores a relationship, identity, or private-life theory**, even
  as a "rejected" row — the same content filter used everywhere else on
  the site runs on every fan-theory candidate before it's written.
- **Never sends more than one Community Tasks email/day**, plus at most one
  short same-day "replies waiting" follow-up.

## 6. Kill-switch drill (recorded 2026-09-07)

To prove the switch above actually works before relying on it operator-facing:

1. Set `COMMUNITY_SCAN_ENABLED=false` via `gh variable set`.
2. Manually triggered `community-scan.yml` (`gh workflow run`).
3. **Result: the run completed in ~1s, green, and its own log printed**
   `"COMMUNITY_SCAN_ENABLED is not set — skipping this run entirely. Kill
   switch, not a fault."` — no checkout, no npm install, no DB
   connection, no Reddit fetch happened. Confirmed via `gh run view --log`.
4. Reset `COMMUNITY_SCAN_ENABLED=true` (its normal live value) immediately
   after, so the drill left production state unchanged.

Same kill-switch code path (`vars.COMMUNITY_*_ENABLED` checked as the first
step, before `actions/checkout`) is shared by `community-crawl.yml`
(`COMMUNITY_CRAWL_ENABLED`) — see that workflow's own "Kill-switch check"
step, which is byte-for-byte the same pattern verified above. No separate
drill was needed for the crawl switch; it is the same guarded code shape,
already off by default, and turning it on is an explicit action a human
takes (§4.2), not something a drill needs to exercise pre-emptively.

## 7. Where things live (for when you want more detail than this doc)

| Question | Where |
|---|---|
| Full engineering spec, data model, every card | [`docs/proposals/2026-09-06-community-engine-plan.md`](../proposals/2026-09-06-community-engine-plan.md) |
| Which subreddits/FB groups are watched, and their self-promo rules | [`docs/community/watchlist.md`](watchlist.md) |
| How Clownbot/the site actually uses fan-theory rows | [`CLOWNBOT.md`](../../CLOWNBOT.md) § How something new enters the store |
| Every scheduled workflow, cadence, and what it mutates | [`docs/AUTOMATION.md`](../AUTOMATION.md) § Community engine |
| The end-to-end fixture dry run that proved the pipeline wires together | [`docs/community/p1-7-dry-run.md`](p1-7-dry-run.md) |
| Reddit/Facebook posture decisions (no FB crawler, comment scope, etc.) | [`docs/decisions.md`](../decisions.md), 2026-08-11 and 2026-08-25 |
