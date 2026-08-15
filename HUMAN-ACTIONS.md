# HUMAN-ACTIONS.md — things only Joey can do

Anything needing Joey's identity, login, payment method, approval, or a click in
a UI an agent cannot reach. One file, this exact name, repo root.

**How to use this:** each item has a `**Status:** OPEN` line. Change that one
word to `DONE`, `SKIP` (chose not to — add a few words why) or `BLOCKED` (tried,
something stopped you). **Never cut, paste, or move a block** — a session
reconciles this file and files finished items into DONE with a date. Item
numbers are stable IDs, never reused or renumbered, so "#4" means the same thing
forever. Saying "I did #2" in chat works just as well as editing the line.

`SKIP` is final. No session will re-raise a skipped item or re-argue it.

---

## OPEN

### 1. [BLOCKING] Get the production site and CI off Wyatt's accounts — ~30–60 min

**Why it matters:** Wyatt has left the project, but the live product still runs
on his infrastructure. This is the single largest standing risk in the repo.
Nothing is broken right now, and nothing will warn you before it breaks — if
those accounts lapse or get closed, longlivets.com stops deploying and ~20
scheduled agent routines stop running, and the watchdog will report the runners
as a *quiet queue* rather than as dead.

Three separate dependencies, verified 2026-08-15:

- **Vercel — the live site.** `docs/deploy.md` lines 7–9: production runs
  entirely on **Wyatt's Vercel team**, with you added as a team member. Your own
  personal Vercel account was downgraded to Hobby and is **no longer in the
  deploy path at all**. A merge today deployed to
  `vercel.com/wjduvall-cmds-projects/swift2-web`.
- **GitHub — the scheduled runners.** `docs/agents/runners.md` lines 3–11: "ALL
  scheduled agent spend runs on Wyatt's account", covering ~20 routines
  (Marjorie, Austin, Karen, Kevin, Nils, Laura, Paul Blart, Tree). This was
  deliberate — it keeps your weekly limit free — so **do not just switch it off**
  without deciding where that spend moves to.
- **`wjduvall-cmd` is a bot identity, not just a person.** Repo automation reads
  it to recognise its own runs. It was deliberately left in place today for that
  reason; only his human notifications and email CC were removed.

**Steps:**
1. Go to `https://vercel.com/wjduvall-cmds-projects` → **Settings** → **Members**.
   Confirm you are listed as **Owner**, not just Member. If you are not, have
   Wyatt transfer ownership to you before he loses access.
2. Vercel → **Settings** → **Billing**. Confirm the payment method on file is
   yours, not Wyatt's. This is what actually stops the site if it lapses.
3. Decide where scheduled agent spend should live now that there is no second
   founder to protect a limit on. Tell a session the answer and it will update
   `docs/agents/runners.md` and the workflows.
4. Do **not** delete or rename the `wjduvall-cmd` GitHub account until step 3 is
   done — automation still identifies its own runs by it.

**Worked if:** you can open Vercel → Settings → Billing for the team that serves
longlivets.com and see your own payment method, and you are listed as Owner.

**Status:** OPEN

---

### 2. [BLOCKING] Confirm Karen's cloud routine is actually enabled — ~5 min

**Why it matters:** the Content Integrity Engine (Karen) has not produced a run
since **2026-08-09**. The newest report in her directory was committed by an
unrelated photo-enrichment PR, not by her, which is exactly why the old watchdog
alarm stayed quiet — it was checking that a file existed, not that she ran.

An automated check now covers this (merged 2026-08-15, PR #2141). **It is
expected to send an alert tomorrow.** That alert means "still not enabled" — it
is the honest answer, not a broken check. If it does *not* fire, she ran.

**Steps:**
1. Open the scheduled-agent settings for the account that runs the routines
   (see item #1).
2. Confirm the Karen / Content Integrity Engine routine is **enabled** and shows
   a next-run time.
3. If it is disabled, enable it. If it no longer exists, say so in chat — that
   is a rebuild, not a toggle.

**Worked if:** a new file appears in `docs/audits/engine/` carrying a
`cie-run: source=all` marker, and tomorrow's watchdog alert does not repeat.

**Status:** OPEN

---

### 3. [UPGRADE] Device-check the bottom nav — ~2 min

**Why it matters:** the nav has been fixed three times from code, and each time
a real phone found something the tests did not. Merged 2026-08-15 (PR #2140):
the icon-only threshold moved 5 → 7 and labels dropped 11px → 10px, so all six
tabs should now show **words under the icons**.

**Steps:**
1. Open `https://www.longlivets.com/` on your phone. Hard-refresh.
2. Confirm six tabs, each with a readable label, none wrapping to two lines.
3. If your phone is narrow (360px-class), check the labels still fit.

**Worked if:** six labelled tabs, one line each, no overlap.

**Status:** OPEN

---

### 4. [UPGRADE] API accounts for the marketplace research — ~20 min

**Why it matters:** you asked for a curated dataset of official + viral fan-made
merch. Tier 1 (the official store) is already solved and needs nothing from you.
Everything else in the brief is unreachable from an agent environment —
Etsy/Redbubble/TeePublic return 403, Reddit is refused at the tool level, TikTok
returns an empty shell. You chose "get proper API access first" over browser
automation. Until these exist, agents pointed at those sources would invent
numbers, so the work is deliberately parked.

**Steps:**
1. Reddit script app: `https://www.reddit.com/prefs/apps` → **create another
   app** → type **script**. Save the client id and secret.
2. Etsy Open API Personal App: `https://www.etsy.com/developers/register` (or
   `https://developer.etsy.com`). Save the keystring.
3. Optional, only for referral revenue later: Awin and Amazon Associates.
4. Put the values in the project `.env` yourself — never paste a key into chat.
   Tell a session the key NAMES only, and it will wire them up.

**Known ceiling, so you do not sign up for more than you need:** per-video
TikTok/Instagram view counts for accounts you do not own are **not obtainable**
on any legitimate path, and Etsy listings carry **no review count**. Hype
evidence will be Reddit score + comments + press mentions.

**Worked if:** the `.env` holds a Reddit client id/secret and an Etsy keystring.

**Status:** OPEN

---

### 5. [UPGRADE] Five product/tech decisions that lost their owner — ~10 min

**Why it matters:** these were Wyatt's calls. With him gone they are yours, or
they ship unratified by default. None is urgent; all are cheap to answer.

1. **Clownbot's model tier** — currently `claude-sonnet-5`, one named constant.
2. **The 200/day/instance Clownbot cap** — keep, raise, or lower.
3. **Ratify the Mood route pattern** (or say you do not care, which is a valid
   answer and closes it).
4. **Sign off the Clownbot decisions entry** in `docs/decisions.md`.
5. **The era reader's bottom nav** formally overrides
   `docs/specs/2026-08-13-landing-page-brief.md` §3.2/D3. It is already shipped;
   this just records that you meant it.

**Worked if:** you answer in chat. A session writes the answers into
`docs/decisions.md`.

**Status:** OPEN

---

### 6. [UPGRADE] Should `auto-merge-content` keep auto-landing UI code? — ~2 min

**Why it matters:** PR #2140 changed two `.tsx`/`.ts` files and merged itself
with no human involved. That is `auto-merge-content.yml` working exactly as
written — its guard only blocks server-executing and secret-reading files, and a
client component is neither — but the name says "content" and it is now shipping
interface changes unattended.

**Options:** leave it (fast, and CI still gates every merge); restrict it to
content files only; or keep the behaviour and rename it so it stops being
surprising.

**Worked if:** you pick one in chat.

**Status:** OPEN

---

### 7. [UPGRADE] Three questions left open when #2110 merged — ~5 min

**Why it matters:** you deferred these to land the branch. Merging did not
answer them, and the dataset ages from here.

1. **Instagram + TikTok** — your item 4b named both; the build brief omitted
   them. They are a different shape (creator accounts, not joinable groups), so
   scope was not widened without you. In or out?
2. **Who owns refresh cadence** — invites rotate and groups go private. The data
   was accurate 2026-08-14 and decays from there.
3. **`r/TravisAndTaylor`** was excluded as an anti-fan snark board — ratify or
   veto. `r/GaylorSwift` was kept, flagged private since Aug 2025.

**Worked if:** you answer in chat; a session records it on the issue.

**Status:** OPEN

---

### 8. [UPGRADE] Turn on the spam gate for link submissions — ~10 min

**Why it matters:** you asked for "a very simple captcha... the box you click
that says I'm human" on the Community/Merch link-submission form. That's now
built (Cloudflare Turnstile, "managed" mode — it usually passes invisibly and
only shows a checkbox when Cloudflare's own risk signal is ambiguous). It
ships **inert**: no Cloudflare account exists yet, so the code detects the
missing key and skips verification entirely — the site keeps working
normally in the meantime, exactly as it does today (honeypot + rate limiter
only). Nothing breaks by leaving this OPEN.

**Steps:**
1. Log into `https://dash.cloudflare.com` (sign up free if you don't have an
   account — the domain does not need to be on Cloudflare for this to work).
2. Left sidebar → **Turnstile** → **Add site**.
   - Site name: anything, e.g. `Long Live submissions`.
   - Domain: `longlivets.com`.
   - Widget mode: **Managed**.
3. Cloudflare shows you two values: a **Site Key** and a **Secret Key**. Copy
   both.
4. From a terminal, in the repo, with the Vercel CLI set up (see
   `docs/deploy.md`):
   ```bash
   vercel env add NEXT_PUBLIC_TURNSTILE_SITE_KEY   # paste the Site Key
   vercel env add TURNSTILE_SECRET_KEY             # paste the Secret Key
   vercel --prod
   ```
   Choose **Production** (and Preview, if asked) when each `vercel env add`
   prompts you for environments.

Full write-up: `docs/ops/community-merch-submissions.md`, Part 4.

**Worked if:** open the Community or Merch page — most of the time nothing
looks different (the widget passes invisibly). Submit a test link and
confirm it still works and still shows up as a GitHub issue.

**Status:** OPEN

---

## DONE

<!-- Finished items move here with a date. Numbers keep their original ID.
     Never delete — the history is how we stop re-asking. -->
