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

### Awareness replies (10+ a day)

Owner direction 2026-10-01 (`docs/strategy/growth-strategy.md`, bet 2): find
Reddit and Facebook threads where a reply **with no link** invites "what is
that?!", then explain once someone asks. The system finds the threads, drafts
a short reply and posts the lot to the same Discord channel under **Tree ·
Awareness replies**. **You post every reply yourself** (guardrail 6); nothing
posts automatically.

**A reply is plain text by default** (owner rejected a card reply 2026-10-01,
#4767: a Long Live card in a comment thread reads as branded promo and tells
the reader nothing). A share card is attached only for the rare lead where the
picture IS the answer — the drafting step has to opt that lead in, and the sub
has to allow image comments. Most cards you get will have nothing attached.

Every 3 hours (a batch about 45 minutes past 00, 03, 06 ... 21 UTC, when there
is something to send) Tree posts two messages per opportunity, with no batch
header and no explanatory text (owner 2026-10-05: "the link, the text to post,
and the image"): the card, and right after it the reply text on its own.

```
https://www.reddit.com/r/<sub>/comments/<id>/<slug>/     [card PNG attached, rarely]
✅ Posted · Skip
ref: reddit · <lead id>        (Reddit only; routes a ✅/⏭️ reaction)
```
```
[the reply text, alone, nothing else in the message]
```

The link is the canonical thread URL with every tracking parameter stripped
(`cleanThreadUrl` in `scripts/community/awareness-message.mjs`; Facebook keeps
only post/comment ids such as `story_fbid`, `id`, `comment_id`). The reply is
its own plain message because long-press **Copy Text** copies a whole message,
so that message holds only the reply. Tap Posted/Skip (or react) on the
**card**, not the reply message — the links live on the card so they never
end up in what you copy.

Usually there is nothing attached: paste the reply and post. When a card IS
attached it comes as a PNG (not a link) — paste the reply, attach the picture,
post. Either way: no link, no site name in the text. The reply earns its place
by being useful in the thread; if someone asks what the site is, that is the
moment to talk about it.

How it works, in three workflows (kill switch: repo variable
`AWARENESS_LANE_ENABLED=false`; unset means on):

1. The owner-installed home Reddit reader runs every 20 minutes, discovers
   threads through public RSS, and enriches at most 20 through anonymous public
   `.json` pages. `community-awareness-scan` remains the automatic RSS-only
   fallback: it skips only while the home heartbeat is fresh and enabled, and
   runs when the reader is absent, stale, tripped, or unreadable. Both paths read
   `scripts/community/awareness-subs.json` (the subs, a note on
   each one's self-promo rule, and the caps). The fallback takes the feeds fetched
   longest ago first: every sub in hot and new, plus Reddit-wide search RSS,
   so each feed is asked several times a day. A 429 stops the run and puts that
   feed, and the whole scan, on a cooldown (30 minutes, doubling to 6 hours)
   remembered across runs in `awareness_source_state`. Search finds Taylor
   threads outside the fan subs (r/popculturechat, r/AskReddit, r/Music ...),
   the best targets; those use a strict Taylor-name filter and a block list.
   It keeps titles that fit a picture: era
   rankings/debates, timeline questions, Easter-egg/theory threads, nostalgia
   and anniversary threads, news reactions. It skips threads older than 48
   hours, megathreads, crafts and fan art, redline and personal-life topics
   (guardrail 4), NSFW subs, and anything already seen. Caps: 2 per sub per
   run, a day budget of cap+1 candidates per sub, 6 per run. Recent screened Facebook
   export leads are adopted as awareness rows too.
2. `community-draft-replies` (every 3 hours; P1-10, replacing the agentic
   `routine-awareness-answerer`) runs `scripts/community/draft-replies.mjs`: ONE
   single-shot model call per eligible lead (at most 6 a run) through the shared
   subscription wrapper at community priority (P3, no backup token), and does
   nothing when no lead is waiting. The weekly-limit gate pauses it; a limit or
   an unavailable wrapper leaves the lead `new` (no draft beats a bad draft).
   The model has no tools, shell or database access. For Reddit leads it gets
   the title and the stored snippet. Fetching the post text and a few top
   comments (no author names) from the public thread JSON is **off by default**:
   it needs the repo-level env flag `REDDIT_THREAD_JSON=1`, which
   `community-draft-replies.yml` deliberately does not set during the shadow
   week ending about 2026-10-23. HA #130 approved anonymous public `.json`, but
   this existing collector stays dark until the shadow period ends. With the
   flag off, no Reddit request is made at all. Any fetched text is transient and never stored or
   logged (Facebook leads are lead-only: title, no fetch). The system prompt is
   `docs/agents/runner-prompts/awareness-answerer.md`. Replies are validated by
   the same code as before (`awareness-draft.mjs applyDrafts`): a reply with a link,
   a domain, "check out", an em dash or more than 300 characters is rejected,
   and a picture id, if the agent asked for one at all, must exist in the real
   catalogue. No picture id means a text-only reply, which is the normal case.
   Delivery lints every reply again.
3. `community-awareness-deliver` sends at most 5 per batch, 3 per sub per day
   (4 for r/TaylorSwift and r/swifties) and 15 per day, image-capable subs
   first, unverified next, **text-only sub** last. A card is attached only on
   an image-capable sub for a lead the drafting step opted in; everything else
   ships as text, so no sub is ever dropped for its image setting.

**Image comments per sub.** The scan reads one sub's public `about.json` per run, caches a good reading for a week (and a blocked attempt for 12 hours) in `awareness_sub_cache`,
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
Delivery is at-least-once: if Discord confirms a message but marking the lead
`delivered` then fails, that opportunity can arrive again in a later batch;
skip the repeat. Posting an awareness reply does not count toward the 20 non-promo
contributions the link gate waits for (it is promotion, not a plain contribution).

Expect to spend roughly 10–15 minutes on this most days.

#### No Reddit API key, ever

Owner decisions, 2026-10-01 and HA #130 on 2026-10-17
(`docs/decisions.md`): this project will never have a Reddit API key, OAuth,
login, or account automation. Discovery uses public RSS; the home reader may
read anonymous public `.json` thread pages. Nobody proposes, files a card for,
or asks the owner for Reddit credentials, a Reddit app, or any `REDDIT_*`
secret.

**Home reader safety.** Every Reddit request carries
`LongLiveTS-reader/1.0 (+https://www.longlivets.com)`, waits at least six
seconds plus jitter after the previous request, and no run details more than
20 threads. HTTP 403/429 or a non-JSON detail response stops the run on that
first response with no retry. A local circuit file skips the next three runs
(about 60 minutes), doubles that count after another trip (capped at 72 runs,
24 hours), and records the reason and time. A trip or skipped run disables the
home heartbeat immediately, so
the existing GitHub RSS lane keeps working.

#### Home PC reader: run and install

The reader writes metrics to the existing `engagement_lead` fields and writes
top-level comments plus their first replies, with authors omitted, to
`.artifacts/home-reddit-crawl.json` in the existing crawl-bundle shape. Test a
single thread safely before installation:

```
node --import tsx scripts/home/reddit-reader/reader.mjs --dry-run --subreddit TaylorSwift --max-threads 1
```

The owner installs the Windows Scheduled Task in P1-26; agents do not install
it. The installer references an existing local env file without copying its
contents into the task:

```
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/home/reddit-reader/install-task.ps1 -EnvFilePath <local-untracked-env-file>
```

Dry-run makes no database or crawl-bundle write. The local breaker state is
still updated because a safety trip must survive the next scheduled run.

#### Replying as the brand account

If you are logged into two Reddit accounts, every Reddit thread link Tree sends
to Discord as a reply opportunity carries the URL
parameters in `scripts/community/reddit-account.json` (`redditLinkParams`,
including `target_user=NegativeRest9507`, the same parameter Reddit's own email
links use), so the link opens as the brand account. Each such message also has
a `↪️ Reply as u/NegativeRest9507` line. Change the parameters in that file, no
code change needed. Non-Reddit links are left untouched. Awareness-reply
cards are the exception (owner 2026-10-05): their link is stripped to the bare
thread URL with no `target_user` and no `Reply as` line, so check which
account you are on before posting.

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

Separately from the daily email, the home reader collects new public Reddit
threads and their shallow comment trees (never Facebook — see §5) from
Taylor-Swift subreddits and pulls out recurring fan theories (things like
"fans think the next re-record drops in March"). Nothing from this ever
gets posted anywhere. It just makes Clownbot (the site's chat) and the Clue
Web/eggs board able to say "here's what fans are currently theorising,"
citing real threads. You'll never be asked to review or approve individual
theories — the redline filter used everywhere else on the site drops
anything about relationships, identity, or private life before it's ever
stored.

The owner installs the paced home reader separately in P1-26. The older GitHub
year-deep crawl remains behind its own switch and ships **off**; see §4.2.

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

### 4.2 Turn ON the GitHub year-deep crawl fallback (off by default)

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

That fallback crawl runs once a day (07:13 UTC). The home reader produces the
same crawl-bundle structure from new threads independently of this switch.
Neither path touches Facebook (see §5) or writes directly to the live site;
both only stage raw data for the theory-extraction step.

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
- **Never crawls Facebook.** The only Facebook input is the owner-run browser
  extension export: the explicitly configured top three groups run daily and
  the rest weekly. The same read-only pass reads only the owner's own activity
  entries and their reply/reaction counts. There is no Facebook bot, relay,
  API call, posting, reacting, or commenting
  (`docs/decisions.md`, 2026-08-11).
- **Never stores a Facebook member name, post quote, or comment body.** Lead
  rows contain a canonical post URL, counts, and a non-text locator; authors
  remain hashed only inside the parser. Owner-activity rows contain URLs,
  opaque ids, and counts only.
- **Never stores a Reddit username.** Comment text exists only in the local,
  transient crawl bundle used by the theory lane; engagement leads store no
  comment text.
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
