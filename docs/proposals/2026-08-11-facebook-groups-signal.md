# Proposal — Facebook groups as a signal source, and as site content

Owner: Wyatt (CTO). Status: **PROPOSAL — pending Wyatt's approval.**
Date: 2026-08-11. Raised by Wyatt: *"There are several facebook groups which
are key to the taylor swift gossip mill. Can we set up a bot that ~twice a day
or so opens facebook, checks those groups, and creates tickets or somehow
ingests that content onto the site?"* plus a follow-up asking whether we should
"color outside the lines" and crawl it anyway.

---

## 0. The short answer

**No — we cannot have a bot that opens Facebook and reads those groups.** Not
because of caution, but because the door was bricked up by Meta in April 2024
and the only remaining way through is one that trades a real asset (the
founders' accounts) for content our own privacy policy would refuse to publish.

Three findings drive everything below, in descending order of how load-bearing
they are:

1. **The Groups API is gone.** Not restricted — *removed*, from every API
   version, on 2024-04-22. **Including the admin path.** Being an admin of a
   group unlocks nothing; Meta removed the ability for group admins to install
   apps on a group in the same stroke. There is no App Review to submit, no
   permission to request, no asset Joey could acquire. This is worth stating
   plainly because the natural assumption — "surely we can read groups we
   *run*" — is false.
2. **Almost nothing a scraper collected could legally ship anyway.** Group
   posts are written by private individuals, whom `privacy-redlines.md` puts
   on the Never-OK list, under a standing rule that **attribution does not
   launder a privacy violation**. Worked through in §3: the publishable
   fraction is close to zero, and the part that *is* publishable is exactly the
   part already reaching us through public reporting.
3. **So the risk has no payoff.** The scraper's yield is not "gossip we can
   publish." It is "gossip we then have to go find a real source for" — which
   is what the intake door already does, from sources that don't cost us an
   account.

What we *can* have is in §5: a **near-zero-friction assisted intake** that
turns a founder already reading these groups into the sensor, with the fleet
doing the sourcing work. And §6 ships the site-content half Wyatt asked for,
which never depended on the access question at all.

---

## 1. The access question, answered

### 1.1 The Graph API Groups endpoints

Meta's own v19.0 changelog is unambiguous. As of v19.0, applying to **all
versions** on **2024-04-22**, Meta deprecated:

- the permissions `publish_to_groups` and `groups_access_member_info`,
- the **Groups API** itself as a reviewable feature,
- and "the ability for group admins to install apps on the group, **even if
  they have an admin or developer role on the app**."

Source: [Graph API v19.0 changelog](https://developers.facebook.com/docs/graph-api/changelog/version19.0).
Corroborated by [Sprinklr](https://www.sprinklr.com/help/articles/getting-started-facebook/meta-deprecates-facebook-groups-api/66229eb25f9dd9599d632712)
and [Zoho](https://help.zoho.com/portal/en/community/topic/discontinuing-facebook-groups-due-to-api-deprecation),
both of whom retired shipped Facebook-group features because of it.

**What this kills, specifically:**

| Path | Status |
|---|---|
| Read a group's feed via Graph API | **Gone.** No endpoint, no permission. |
| Read a group we *administer* via an installed app | **Gone.** Admin-install removed explicitly. |
| App Review to request group access | **Nothing to request.** The reviewable feature was withdrawn. |
| Group member counts / member info via API | **Gone** (`groups_access_member_info`). |

**Answering the question directly: which groups would the founders need admin
rights on?** None. There is no group, however owned, that admin rights would
unlock. This is the one path that would have been clean — an operator-installed
app on a group Joey runs — and Meta closed it specifically. If we later learn
Meta has reopened a Groups product for developers, this section is the thing to
re-check; as of today there is nothing to apply for.

### 1.2 Meta Content Library (the CrowdTangle successor)

CrowdTangle — which *did* expose public group content — was shut down
2024-08-14. Its replacement, Meta Content Library, is restricted to "qualified
academic or nonprofit institutions pursuing scientific or public interest
research," applied for through the ICPSR at the University of Michigan.

Long Live is a commercial fan app. **We do not qualify**, and applying under a
research framing we don't meet would be misrepresentation. Access is also
reported as slow and heavily rationed even for eligible researchers
([CJR](https://www.cjr.org/tow_center/meta-is-getting-rid-of-crowdtangle.php),
[NPR](https://www.npr.org/2024/08/14/nx-s1-5074143/meta-shutters-tool-used-to-fight-disinformation-despite-outcry)).

### 1.3 RSS / third-party aggregation

Facebook has exposed no RSS for groups for over a decade, and the third-party
tools that used to aggregate group content (Buffer, Hootsuite et al.) lost the
capability in the same 2024 deprecation. There is no durable vendor to buy our
way to; the ones advertising it operate through the browser-session route in
§2, and inherit its problems.

---

## 2. On "coloring outside the lines" — engaging the proposal on its merits

Wyatt's proposal: a lightweight crawler, ~2×/day, randomized timing and
behavior, deliberately not a load on Facebook and not obviously a bot.

It is a fair question and the instinct behind it — *we're barely touching them,
who is harmed?* — is reasonable. Here is the honest case against, strongest
argument last. **None of these is "the rules say no."**

### 2.1 The one place the proposal is partly right

Credit where due: the legal picture for **logged-out, public** scraping is not
as settled in Meta's favor as it sounds. In *Meta v. Bright Data*, a California
federal court held that Bright Data did **not** breach Meta's terms by scraping
public Facebook and Instagram data while logged out
([Zyte](https://www.zyte.com/blog/california-court-meta-ruling/),
[Eric Goldman](https://blog.ericgoldman.org/archives/2024/01/game-on-bright-data-scores-major-victory-in-web-scraping-dispute-with-meta-guest-blog-post.htm)).
So "scraping Facebook is illegal" would be an overstatement, and we shouldn't
make it.

**But that safe harbor does not reach the thing we actually want.** It covers
*logged-out public* data. The groups that constitute the gossip mill are
valuable precisely because they are **private/closed** — members-only, which by
definition requires being logged in *and* admitted as a member. The moment the
crawler holds a session cookie, it leaves the Bright Data fact pattern entirely
and lands in the fact pattern Meta actually wins: *Meta v. Voyager Labs*, which
targeted software designed "to use fake accounts to scrape data accessible to a
user when logged into Facebook, including profile information, posts, friends
lists, photos and comments." That one settled with a **permanent injunction and
a monetary payment to Meta**
([Meta newsroom](https://about.fb.com/news/2023/01/leading-the-fight-against-scraping-for-hire/)).

And Meta's terms close the door the ruling left ajar, in terms drafted to
anticipate exactly this argument:

> "You may not access or collect data from our Products using automated means
> […] without our prior permission, **or attempt to access data you do not have
> permission to access, regardless of whether such automated access or
> collection is undertaken while logged-in to a Facebook account.**"
> — [Meta Terms of Service](https://www.facebook.com/terms.php)

The [Automated Data Collection Terms](https://www.facebook.com/legal/automated_data_collection_terms)
narrow permitted automated collection to search-engine results and Meta-URL
previews. Ingesting group content into a fan site is not on that list.

### 2.2 The account-risk asymmetry — this is the expensive one

**Meta does not action the script. It actions the account.** There is no
outcome where the crawler is caught and we simply lose the crawler.

The realistic consequence for a personal or business account caught automating
is a cascade: reporting through 2025 describes business and personal accounts
disabled together, "and within hours or days, their personal Facebook account
follows, with any connected business pages, ad accounts, or assets they manage
for clients cascading into suspension," typically with no meaningful appeal
path ([Richt Law Firm](https://richtfirm.com/meta-account-suspensions-understanding-the-2025-ai-moderation-crisis/)).
Enforcement is account-level, not post-level.

Priced against what we'd actually lose, this is a bad trade in three ways:

1. **It costs us the legitimate access we already have.** Joey and Wyatt are in
   these groups *as humans*, entirely permissibly, today. That is real, working
   read access to the gossip mill. A ban converts a working legitimate channel
   into no channel — the automation would destroy the very asset it was built
   to exploit.
2. **It costs the distribution channel.** The repo already runs a Facebook Page
   for cross-posting (`scripts/social/post-queue.mjs` →
   `crosspostToFacebook()`, `FB_PAGE_ID` + `IG_ACCESS_TOKEN`), and
   `docs/marketing/growth-plan.md` treats the FB Page as infrastructure. A
   cascade takes the Page and quite possibly the linked Instagram with it.
   We would be risking the *outbound* channel to gain an inbound one.
3. **The stake is a founder's personal account.** Not a company asset we can
   re-provision — Joey's or Wyatt's own Facebook identity, with whatever
   personal history is in it. And using a burner account instead is worse, not
   better: fake accounts are the specific aggravating fact in Voyager.

### 2.3 Does randomized timing actually help in 2026?

Substantially no — but let me be precise rather than just agreeing, because the
sources support a narrower claim than "jitter is useless."

Interval randomization defeats **rate-based heuristics**: "this client
requested 400 pages in a minute." That family of detection is real, and jitter
genuinely addresses it. If rate limiting were the whole stack, the proposal
would work.

It is not the whole stack, and the signals that matter now are ones timing does
not touch:

- **Automation-framework detection.** Headless/driver stacks are fingerprinted
  directly — commercial detection explicitly "identifies automated browsers
  like Selenium or Puppeteer" ([Fingerprint](https://fingerprint.com/blog/how-to-detect-ban-evasion/)).
  This fires on the first request. Request #1 at a random time is still
  request #1 from Puppeteer.
- **Device fingerprinting** across 100+ browser/device signals, plus
  **browser-tampering detection** aimed at anti-detect browsers — i.e. the
  countermeasures themselves are a signal.
- **Velocity and linkage signals** tying many accounts/IPs to one device.
- **Account history**, against which a years-old human account that abruptly
  starts polling two groups on a schedule is itself anomalous.

Detection is layered — "device intelligence, behavioral analysis, network
signals, and account history." Jitter perturbs one input to one layer. The
honest verdict: **randomized timing is a countermeasure to roughly the 2015
detection stack**, and the remaining layers are unaffected by it. Beating them
requires anti-detect browsers and residential proxies — i.e. escalating into
deliberate evasion infrastructure, which is both a much larger build and, as an
expressed *design goal of evading detection*, the point at which "coloring
outside the lines" stops being a gray area.

Also worth saying: "not a drag on Facebook's systems" is true and irrelevant.
Enforcement is not triggered by load. Voyager Labs was not a load problem.

### 2.4 The privacy wall at the end of the pipe — the argument that stands alone

**This one holds even if §2.1–2.3 were all resolved in our favor**, and it is
the reason I'd advise against the crawler even with Meta's blessing in writing.

`docs/content-ops/privacy-redlines.md` is binding and beats every other
consideration, including "a real outlet reported it." Its Never-OK list
includes **private individuals' private lives** — "family, friends, staff, and
vendors appear only in their public-facing roles. Nothing about minors beyond
family facts the family published" — plus health/body speculation, sexuality
speculation, location above the provenance cap, and leaked material as
sourcing. And the header rule: **attribution does not launder a privacy
violation.**

A Facebook gossip group is, structurally, a stream of private individuals
talking about a public figure. Sort a realistic scrape by what could ship:

| What the crawler collects | Publishable? | Why |
|---|---|---|
| A member's post, in their words | **No** | Private individual's speech; quoting it republishes them. |
| The member's name, handle, or photo | **No** | Private individual. Never, at any provenance. |
| A screenshot of a thread | **No** | Carries names/photos of private individuals wholesale. |
| "Fans in the group are saying X" | **No** | Not adjudicable — `intake.md` refuses reaction/"fans are saying" pieces by rule, because nothing can ever retire them. |
| A member's sighting: "saw her at ___" | **No** | Unofficial → L0 cap. A member-reported venue is exactly the L2-speculation case the matrix forbids. |
| Pregnancy / health / sexuality chatter | **No** | Never-OK items 3 and 4. Much of the "gossip mill" *is* this. |
| A leaked tracklist / screenshot from a private account | **No** | Never-OK item 6, regardless of who republished. |
| A member linking a *named outlet's* article | **Yes** — but the outlet is the source, not the group | This is a **lead**, and the group is incidental. |
| The group's own published membership milestone | **Yes**, with sourcing | Aggregate about a community, no private individual. See §6. |

**Only the last two rows survive, and neither needs a scraper.** The
second-to-last is a link to public reporting we can reach directly. So the
crawler's entire realizable output is: *a pointer telling us to go read an
article we could have found through the channels we already run.*

That is the payoff-free part. We would be taking account-loss risk, building
evasion infrastructure, and ingesting a large volume of private individuals'
speech into our systems — to obtain pointers to public articles.

### 2.5 The leakage argument — early, not exclusive

The remaining case for the crawler is *timing*: even if the only publishable
output is a pointer to public reporting, the group might surface it hours
earlier.

I audited the corpus rather than asserting this. **Census of all 36 authored
`rumors` entries in `supabase/seed/content/**` (the whole population, not a
sample):**

- **36 of 36 cite a professional publisher domain.** Zero facebook.com, zero
  reddit.com, zero tumblr.com, zero forum or Discord URLs.
- Across **1,161 typed sources** in seed content: `reputable_press` 830
  (71.5%), `wiki` 162, `official` 72. Fan-adjacent types total **3 — 0.26%** —
  and the single `fan_forum` is Songfacts, a lyrics-annotation site.
- The `RumorSourceTier` enum is `official | established | tabloid | social`.
  **There is no `fan`, `forum`, or `community` rung**, so a group post is not
  merely disfavored — it is structurally unrepresentable as a source.
- The current news digest: 77 candidates, **100% press**, zero fan-community
  rows.

**The decisive evidence is the pickup pattern.** Several rumors we carry
*demonstrably originated in fan communities* and reached us through mainstream
reporting anyway:

| Fandom-native origin | How it reached us |
|---|---|
| The Woodvale theory ("fans spotted" it on the `folklore` cover) | W Magazine, resolved by Rolling Stone |
| A fan-run inventory bot flagging a ~250k vinyl restock | Radar Online (via AOL) |
| Fan case that TS13 was imminent | Yahoo Entertainment |
| Spotify canvas colour-change / easter-egg readings | Bustle, Elite Daily |
| Three Deuxmoi items (an Instagram gossip account) | Cosmopolitan, Yahoo, AOL, heavy.com |

So the pipeline is **not blind to fandom-originated claims — it catches them on
the pickup**, which is precisely the mechanism this argument asserts. And
because `rumor-pipeline.md` bars origination outright (*"We never originate"*),
an early lead still waits for an outlet before it can ship: **hours of lead time
convert to zero hours of publishing advantage.**

**Two honest qualifiers, because the evidence doesn't support the strong form
of this claim:**

1. **"Within hours" is unmeasured.** Nothing in this repo instruments latency.
   The digest's 72h lookback and the 45-day `faded` state suggest the operating
   assumption is days-to-weeks for a claim to resolve, not hours for it to
   surface. The pickup pattern is well evidenced; the *speed* of pickup is an
   assumption, and I'd rather flag it than dress it up.
2. **Reddit and Tumblr were excluded on legal grounds, not on "they'd add
   nothing."** `docs/proposals/2026-07-18-news-source-research.md` found both
   *"technically easy at hourly cadence"* and gated them on commercial-licensing
   terms, deletion/TTL obligations, and attribution — not on lack of value. So
   the fair version of this argument is **"the compliant channels already catch
   it,"** not "fan communities are worthless as signal." They aren't. They're
   just not channels we can compliantly automate.

Separately: **we are not a breaking-news product.** The Vault covers what has
already happened (`docs/decisions.md`, 2026-07-11), and the news pipeline
already polls 6×/day. A twice-daily group check is *slower* than the rail we
run today.

**The caveat I want on the record:** if a group is genuinely **exclusive** —
originating claims that never reach public reporting at all — that changes the
calculus, because then no other channel can substitute. But note what follows:
a claim that *only* ever exists as private-individual posts in a private group
is precisely a claim we can never publish under §2.4, since it will never have
a nameable source. Exclusivity makes it *more* unpublishable, not less. The
honest framing is that groups are valuable to us as **early warning**, and
early warning is a job a human skim does perfectly well (§5).

### 2.6 What I did not do

I did not build, prototype, or sketch a crawler; did not test any scraping
approach against Facebook; did not touch credentials; and did not log in. The
access findings above come from Meta's own changelog, terms, and newsroom, plus
secondary reporting — not from probing the platform.

---

## 3. Recommendation

**Ranked, most durable first.**

| # | Option | Effort | Durability | Verdict |
|---|---|---|---|---|
| 1 | **Assisted intake** — a founder forwards a lead by email; agents source it from public reporting (§5) | Low | High — no platform dependency | **Recommended.** |
| 2 | Keep leaning on the existing news pipeline + Rumor Desk | None (already running) | High | **Already in place.** Complements #1. |
| 3 | Partner with a group admin who *volunteers* to send us tips | Low build, high social cost | Medium — depends on a person | Worth it only if a founder already has the relationship. |
| 4 | Meta Content Library | — | — | **Ineligible** (commercial). |
| 5 | Operator-installed app on an owned group | — | — | **Impossible.** Admin-install removed. |
| 6 | Logged-in crawler | High and rising | Low — one detection change ends it | **No.** §2. |

**The recommendation is #1 + #2**, and the honest framing is not that #1 is a
consolation prize. The bottleneck was never *seeing* the gossip — the founders
already see it. The bottleneck is turning something seen into something sourced
and authored, and that is agent work, which we have a fleet for.

---

## 4. Privacy guardrails (binding, not advisory)

These are structural, so the rule survives whoever writes the next prompt.

**G1 — A group is a LEAD, never a SOURCE.** This is not new policy; it is
`docs/content-ops/intake.md`'s existing rule applied here: *"The drop is never
the copy — regardless of who or what drafted it… treated as leads only: every
fact gets re-verified against real sources and re-written in fan-editor voice…
Never paste-through, ever, from any source."* A Facebook group is one more
thing that door already covers. **No moment, rumor, or milestone may ever cite
a Facebook group post as its source.** If the claim has no nameable outlet, it
is not publishable — it sits in `needs-sources` or is refused.

**G2 — Private individuals never enter the repo.** The failure mode specific to
this path is not what gets *published* but what gets *stored*: a forwarded
screenshot puts a private person's name and face into a public GitHub issue,
which is a privacy harm even if it never reaches the site. So the intake drop
carries **the claim, in the founder's own words** — never a screenshot, never
the poster's name/handle/photo, never a verbatim quote of a member's post.
Naming the *group* is fine (a group is an entity); naming a *member* is not.

**G3 — The Never-OK list is checked before the lead is even triaged.** Group
chatter is disproportionately pregnancy/health/sexuality/whereabouts
speculation. A lead in those categories is dropped at the door, no matter how
well it later gets sourced — `privacy-redlines.md` checks Never-OK *before*
attribution is considered.

**G4 — No bulk collection, ever.** We do not store, index, or archive group
content. The only artifact is a human-written lead. There is no corpus to leak,
subpoena, or regret.

**G5 — Attribution does not launder.** Restated because this path is where it
will be tested: "a member of a 40k-member group posted it" is not a source, and
neither is "an aggregator reported that a group was saying it."

---

## 5. The assisted-intake design (the buildable recommendation)

**Design goal: near-zero effort for the human, all remaining work on the fleet.**
The founders are in these groups on their phones. The interaction should be no
heavier than forwarding a text.

### 5.1 Reuse the rail we already have

`.github/workflows/marjorie-inbox.yml` already runs a **founder email → GitHub**
relay every 30 minutes: IMAP over Marjorie's Gmail, restricted to the two
founder addresses, **DKIM-verified** (`dkim=pass` required, so it is
spoof-resistant), idempotent on `Message-ID`, deterministic, zero AI. It posts
into the repo as the Actions bot and is explicit that relayed mail is founder
*conversation*, never decision authority.

That is exactly the shape needed here, already built, reviewed, and running on
credentials that already exist (`GMAIL_APP_PASSWORD`, `MARJORIE_EMAIL`) — **no
new secrets**.

**Proposed extension (not built in this PR — needs Wyatt's go-ahead since it
touches a running workflow):** when a founder's email subject starts with
`intake:`, the relay opens an **`intake`-labeled issue** instead of commenting
on the brief thread. Body maps onto the existing
`.github/ISSUE_TEMPLATE/intake.yml` fields (`what` / `when` / `sources` /
`notes`), with the subject line becoming the one-line `what`.

The human flow becomes:

> See something in a group → share/compose an email to Marjorie's address →
> subject `intake: Taylor spotted filming something in Nashville` → send.

No app, no login, no new tool, works on mobile, works offline-ish, and is a
native share target on both iOS and Android because it is *just email*. A
bookmarklet or custom mobile share target would be more build for strictly less
reach; email already is the share target.

### 5.2 What the fleet then does

Unchanged from the existing door — which is the point:

1. **Triage** (Content Shift lane 1, already polls `intake`): apply the
   `privacy-redlines.md` Never-OK check **first** (G3), then the adjudicability
   bar — *"is this a claim we can later adjudicate, from someone we can name?"*
2. **Source it from public reporting.** The agent searches named outlets for
   the claim. Found → author as fact or as a `rumors` entry with outlet, date,
   `sourceTier`. Not found → comment what was searched, apply `needs-sources`,
   leave open. **Never** author against the group as the source (G1).
3. **Author / check / ship** exactly as any other intake item.

### 5.3 Guardrails baked into the drop

The relay must, before opening the issue:

- **Truncate and defang.** Reuse the `defangGitHub` approach already in
  `apps/web/app/api/feedback/route.ts` (ZWSP after `@`/`#`) so a pasted handle
  can't ping a real person or backlink an issue.
- **Refuse attachments.** Images are dropped, not uploaded — that is the
  screenshot vector (G2), and it closes it mechanically rather than by asking
  the founder to remember.
- **Stamp the provenance and the rule** in the issue body, so the triaging
  agent cannot mistake the drop for a source:

  > `⚠️ Community lead — NOT a source. Per docs/content-ops/intake.md and`
  > `privacy-redlines.md G1: re-source from named public reporting before`
  > `authoring, or apply needs-sources. Never cite a group or a group member.`

### 5.4 Cost

Zero marginal cost. No LLM call in the relay (deterministic, like Marjorie's
inbox), no new secret, no new cron — the 30-minute schedule already exists, and
triage happens inside a Content Shift run that already polls `intake`.

---

## 6. Facebook groups as first-class site content

This half never depended on the access question, and it is what landed in this
PR.

### 6.1 How milestones actually work

`MILESTONES` in `apps/web/lib/longlive/content.ts` is **derived**, not authored:

```ts
export const MILESTONES: Milestone[] = CONTENT.filter((c) => c.milestone).map((c) => ({
  id: c.milestone!.id, eraId: c.eraId, date: c.date,
  label: c.milestone!.label, kind: c.milestone!.kind,
}));
```

A milestone is a marker on a moment, so a marker cannot drift from the moment it
points at. **Adding a milestone means authoring a sourced moment and marking
it** — there is no separate list to append to, and therefore no way to add a
milestone without also adding the sourced content that justifies it. That
property is doing real work for us here: it makes fabricating a milestone
require fabricating a moment, which the content checks would catch.

### 6.2 New kind, or an existing one?

The standing precedent (the 2026-07 theory-weaving ruling) is that
fan-community material goes into existing structures rather than new
schema — no new table for fan theories. That precedent is about **not adding
storage**, and it is respected here: **no new table, no new field, no migration,
no new authoring surface.** A community milestone is an ordinary moment with an
ordinary `milestone` marker.

But the existing five *kinds* (`album`, `tour`, `life`, `business`, `award`) all
describe things **Taylor or her business did**. A fan-community event is none of
them, and forcing one would be a category error that actively misleads —
`life` means *her* life. So this adds one value to an existing union:

```ts
export type MilestoneKind = 'album' | 'tour' | 'life' | 'business' | 'award' | 'fandom';
```

**Deliberately `fandom`, not `facebook`.** A per-platform kind would be wrong:
it would put a vendor name in our type system, and it would need a sibling every
time the community moves (Tumblr → Twitter → TikTok → Discord). The platform is
prose and sourcing, not schema. A Facebook group crossing 10k, a subreddit's
milestone, and the friendship-bracelet phenomenon are all one kind.

### 6.3 "A reasonably strong presence in most eras" — the honest answer

**This one cannot be delivered as asked, and it should not be faked.**

Facebook groups do not have documented milestone histories spread across
Taylor's eras. Two hard obstacles:

1. **Most eras predate the evidence.** Debut (2006) and Fearless (2008) precede
   meaningful Facebook-group fandom almost entirely. Manufacturing early-era
   group milestones would mean inventing history.
2. **Membership numbers are essentially unsourceable.** I searched for
   published membership figures or press coverage of specific Taylor Swift
   Facebook groups and **found none** that meet our sourcing bar. Outlets cover
   the fandom in aggregate (e.g. [Rolling Stone](https://www.rollingstone.com/culture/culture-features/taylor-swift-fandom-gaylor-report-exclusive-1234713432/)
   on the Graphika factions report) but do not report group membership counts.
   Live counts are visible on a group page but that is an observation, not a
   citation — and it decays the moment it is written down.

So: **no Facebook group milestone is currently authorable without fabrication,
and none was authored.** Per `CLAUDE.md`'s no-invention rule and the
"port zero data" lesson from the Orbit content, the mechanism ships and the
content need gets filed.

**What *is* genuinely documentable** — and where I'd point the content desk
first, as `fandom` milestones with real citations — is fandom-in-aggregate,
which also spreads across eras far better than any single group could:

- Eras Tour crowd seismic activity (widely covered, dated, aggregate).
- The friendship-bracelet phenomenon (heavily documented).
- The Ticketmaster/Senate hearing fallout (Jan 2023, in the public record).
- Fan-driven voter-registration spikes following her own posts (official).

Each is aggregate, none names a private individual, and each has named-outlet
sourcing. **I have not authored these** — they need the content desk's normal
verification and photo sourcing, and authoring content is not this PR's lane.
Filed as a content ticket instead.

**Recommendation to Wyatt on the ask itself:** read "strong presence in most
eras" as *fan community* presence, not *Facebook group* presence. The community
genuinely spans every era and is genuinely documented; Facebook groups
specifically are one platform's slice of the last decade with no citable
history. `fandom` delivers the intent; a `facebook` kind could only deliver it
by inventing things.

### 6.4 What shipped

| Change | File |
|---|---|
| `fandom` added to the union, with the sourcing bar in the doc comment | `apps/web/lib/longlive/types.ts` |
| `fandom` registered in the sync validator | `scripts/sync-longlive-content.mjs` |
| **Silent-drop bug fixed** (below) | `scripts/sync-longlive-content.mjs` |
| Derivation + sync tests for the new kind, and for the loud drop | `apps/web/lib/longlive/content.test.ts`, `scripts/sync-longlive-content.test.ts` |

**No seed content.** No milestone was invented.

**The bug found on the way.** The sync script validated `milestone.kind`
against a hardcoded array and **silently discarded** any marker whose kind
wasn't on it. A milestone authored with a new or typo'd kind vanished from the
scrubber with no error, no warning, and a green build — the same
"declined and misconfigured look identical" failure the auto-merge allowlist
entry (`docs/decisions.md`, 2026-08-11) was written about. It now warns on
stderr naming the marker id, the moment slug, and the bad kind. Kept
**non-fatal** deliberately: this script runs on every content PR and a bad
marker must not break the pipeline for other desks.

**Note on rendering:** nothing in the app branches on `MilestoneKind` today —
`TimelineScrubber.tsx` renders every kind as an identical dot. So `fandom`
renders correctly but not *distinctly*. Giving it its own treatment means
introducing the first kind-based styling in the scrubber, which is a design
decision (and touches a file other agents are active in), so it is deliberately
not in this PR. Flagged as a follow-up.

---

## 7. Open questions for the founders

1. **Wyatt — approve the `marjorie-inbox.yml` extension in §5.1?** It touches a
   running workflow, so it is not in this PR. It is ~30 lines and reuses
   existing secrets.
2. **Joey — which groups?** The proposal never needs their names for access,
   but §5 triage is sharper if we know which communities the leads come from.
3. **Joey — is any group genuinely exclusive** (§2.5), i.e. originating claims
   that never reach public reporting? Doesn't change the build, but it changes
   how hard we chase §5 adoption.
4. **Wyatt — read of "most eras" per §6.3?** Confirm `fandom`-as-community
   rather than Facebook-groups-specifically.
5. **Should `fandom` milestones render distinctly** in the scrubber (§6.4)?
   Product call.
