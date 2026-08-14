# Where Swifties actually gather — the Community dataset

**30 verified communities across 8 platforms. Researched 2026-08-14.**
Dataset: `data/communities.json`. Sources: `sources.md`.

---

## The landscape, honestly

The brief predicted Facebook would be the largest category. It is the smallest.
Not because those groups don't exist — because from outside a login they leave
almost no verifiable trace. Meanwhile forums and fan sites, barely a footnote in
the brief, turned out to hold the best material in the set.

What the research actually found is a fandom that has **scattered rather than
consolidated**. There is no single town square. There's a Discord that is
effectively the front door, a subreddit that is the biggest room nobody can
measure, a Facebook layer that is enormous and invisible, and a long tail of
forums, Tumblr blogs and archive tags carrying decades of institutional memory.

**Where the counts are real:**

| Platform | Entries | Confidence |
|---|---|---|
| Discord | 11 | **High.** Every invite verified through Discord's API, then re-verified independently. Real member and presence counts, 0% drift. |
| Forum / Tumblr / Steam / Wattpad | 11 | **Good.** Nine fetched live. Two (New Taylor Connect, TBN) returned HTTP 406 — a bot-block, not a dead link — so they exist but weren't independently re-confirmed. |
| Facebook | 5 | **Thin but solid.** Every entry traces to a news article or a directly-fetched page. 12 further candidates were dropped rather than described from a name alone. |
| Reddit | 3 | **Names and stories only, no numbers.** See below. |

## The Reddit problem, and why there are no member counts

Reddit blocks this environment outright — HTTP 403 at the edge on both
`www.reddit.com` and `oauth.reddit.com`, and the fetch tooling refuses the
domain entirely. There is no Reddit credential available here.

We did not substitute aggregator numbers, and the reason is itself the finding:
**published member counts for r/TaylorSwift ranged from 200,000 to 3.8 million
across sources fetched in the same week.** A 19× spread. Any dataset quoting one
of those figures would be asserting something nobody can support.

So Reddit entries carry `member_count: null` and `verification: blocked-unverified`,
with `hype_score` derived from the one input still reachable — how often fans
recommend them organically, which the brief's own scoring formula names and which
is arguably the best of the three signals for a discovery feature anyway.

**One API key fixes this.** A Reddit app (client ID + secret, five minutes at
reddit.com/prefs/apps) unblocks `oauth.reddit.com`, restores counts and activity,
and makes the whole dataset refreshable instead of a one-off.

## Top 10, and why each earns its place

1. **r/TaylorSwift (official Discord)** — 99,146 members, 9,465 online. Discord-partnered, screened entry. The de facto front door.
2. **r/TaylorSwift (subreddit)** — the biggest room in the fandom. Its backstory is the draw: a moderator inherited a community she described as genuinely toxic around 2017, rewrote the rules and hand-picked a new mod team. What it is now is deliberate.
3. **ATRL — Taylor Swift megathread** — descends from a 1999 *Total Request Live* fansite. Its members leaked *Reputation*'s artwork and tracklist before the official announcement.
4. **Taylor Swift Fan Club (Discord)** — 144,216 members, the largest verified server. Its own description opens "WE ARE NOT AFFILIATED WITH TAYLOR SWIFT" — in a space full of impersonation, that's a trust signal.
5. **Taylor Swift's Vault (Facebook)** — ~480k. The closest thing to a Facebook town square; became a mutual-aid hub during the Eras Tour, including after the Vienna cancellation.
6. **New Taylor Connect** — fans rebuilt Taylor's *own* official forum after her team shut it down in 2017 to make room for The Swift Life app. The fandom maintaining what the artist abandoned.
7. **r/SwiftlyNeutral** — the take-a-breath room. Exists specifically because the main sub moderates criticism more tightly; neutral ground for fans and skeptics.
8. **Swifties Want Tickets** — 65,838 members. Not a hangout: a mutual-aid ticket desk with volunteer verification, built against scalpers and scammers.
9. **Taylor Swift (discord.gg/taylor)** — highest presence ratio of any server verified (11%). Holds the one-word vanity URL, which Discord only grants to sustained-boost servers.
10. **BuzzJack — Taylor Swift forum** — UK chart-watching culture, where posters track first-week sales the way sports fans track box scores.

## Niches worth knowing about

- **Bracelets** — three Facebook groups exist purely for trading friendship bracelets. A whole economy grew out of one lyric.
- **Tickets** — mutual aid against scalpers, with volunteer verification.
- **Theories** — Tumblr still carries the Gaylor tradition, tracing to early-2010s blogs. Flagged: this speculates about a real person's sexuality without her confirmation, and parts of the fandom object.
- **History** — small, visibly-declining forums like TBN, alive in slow twilight with their own in-jokes. Worth including precisely because they're fading.
- **Fanfic** — AO3's "Based on a Taylor Swift Song" tag is songfic at archive scale: her songs as prompts for entirely unrelated fandoms.

## Three surprises

**A Steam group has 5,374 members and a live 530-person chat.** A PC gaming
platform hosting genuine Swiftie gathering is not something a top-down search
strategy finds.

**Amino shut down its entire platform on 19 December 2025.** Swifties Amino was
a major hub. Older listicles still recommend it — anyone rebuilding this dataset
from secondary sources would resurrect a dead platform.

**Half of all public Discord listings are wrong.** Of 22 candidate invites
tested, 10 were dead or pointed at an entirely different server. One directory
serves *its own* promo invite on every page. One listing labelled an invite
"The Lakes" when the API showed an unrelated 84-member server called "taygracie."
Without per-invite verification, roughly half this dataset would have been
plausible-looking fiction.

## What is deliberately not here

- **`r/TravisAndTaylor`** — excluded. It's an anti-fan snark board, not a corner
  of the fandom. Surfacing it inside a Swiftie app would be hostile to the
  people using it. `r/SwiftlyNeutral` covers genuine critical discussion.
- **`r/GaylorSwift`** — included but flagged: reportedly went private in August
  2025 to avoid trolling around the engagement announcement. Join status
  unconfirmed. Omitting it entirely would distort the map more than a warning does.
- **Instagram and TikTok** — the existing spec (`docs/definition-of-done.md`
  item 4b) names both; the research brief does not. They are a different shape —
  creator accounts, not joinable groups — so this is logged as an open product
  question rather than quietly widened scope.
- **Genius, X/Twitter Communities** — blocked (HTTP 402/403). Absence here means
  unverified, not nonexistent.
- **Era-specific, vinyl, Swiftie-mom, teacher, UK and AU Facebook groups** —
  searched for specifically, zero corroborated. They almost certainly exist;
  they're invisible from outside.

## Two questions this dataset cannot answer

**Who owns the refresh?** The spec requires "an owner with a refresh cadence,"
and it's right to. Discord invites rotate, groups go private, forums die.
`sources.md` makes this re-runnable — but re-running it is a person's job, and
without one this file is accurate on 2026-08-14 and decays from there.

**Is 30 the right size?** The brief expected 30–80 and this lands at the floor.
That is the honest yield at this evidence bar. It could be doubled by relaxing
the bar — and roughly half of what got added would be fiction.
