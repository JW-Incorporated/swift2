# Addendum 3 (2026-10-14 19:55 PDT): owner decisions and the two real Discord cards

## Owner statements
- The owner's Windows PC (tailnet name joey2023, [address omitted]) is ALWAYS ON. It, this machine, and the garage Proxmox server are all available as hosts. (This supersedes Hermes' note that the PC is not always-on.)
- There is no Qwen Reddit browser. Reddit candidates come from the existing Swift2 scan, "which seems to be working tbh". Options he accepts, any of them: (a) keep the existing Reddit approach, (b) build a Qwen-based browser, (c) build another browser extension on his machine. Planner picks.
- Awin and Amazon: owner will find the account details (joined programs, Associates status) LATER and wants the plan to start now. Treat their status as unknown; the plan must put the account steps in as owner actions and must not block other work on them.
- Owner wants the plan started now.

## The two real cards the owner receives (posted by the Discord app "longlive-social-approvals")
Reddit card, 2026-10-10 11:31 PM:
```
https://www.reddit.com/r/popculture/comments/<id>/taylor_swifts_the_life_of_a_showgirl_the_encore/
[Posted](signed ack link) · Skip
ref: reddit · <lead uuid>
<one-line reply text>
```
Facebook card, 2026-10-09 4:30 PM:
```
Find it in: Taylor Swift (Swifties) — <post excerpt> 75 reactions 23 comments · search
[Posted](signed ack link) · Skip
<one-line reply text>
```
Reading of the cards (Swift2 session):
- This resolves conflict C1 in addendum 2: the owner's Facebook cards are built by the awareness path (awareness-message.mjs). The trailing "search" is the `facebookFallbackLine` link, which opens a Facebook SEARCH, not the post. So there is a link of a sort, but it does not take the owner to the post, which is why he cannot use it. A direct post permalink needs the extension fix (hover/resolve the lazy href, add a permalink field, carry it through parser and ingest to engagement_lead.url).
- The Facebook card shows reaction and comment counts ("75 reactions 23 comments"), so the lead already carries engagement counts that could be used to rank threads.
- The Reddit card carries only the thread URL and a one-line reply; no title, subreddit label, reasoning, "Why", or image mentioned in Hermes' description (the paste may have dropped formatting; unverified). Both replies are one generic sentence of opinion. Reply quality and thread selection are the likely reasons Reddit comments get few upvotes; nothing here shows thread age, comment count or velocity.
- Both cards are from 10/9 and 10/10, i.e. before the answerer began failing on 10/12.
- The Posted link goes to longlivets.com/api/community/ack with a signed token; this is the only place a "we posted" event is recorded, so it is the natural hook for recording which comments were posted, and for later reading their score and replies.

## How the planner should treat the Reddit options (Swift2 session view, not a decision)
- Current approach (GitHub scan, anonymous RSS, 2 requests per run, 429 cooldown) yields thin candidate volume but works and costs no Claude tokens in the scan step; Claude is spent only on drafting.
- A real browser on an always-on home machine (the PC, or a garage VM with residential egress) could: read Reddit without 429s; see scores, comment counts and velocity for ranking "most important conversations"; and read the score and replies on the owner's own comments (goals 8 and 9) while logged in as the brand account. It must stay read-only, human-paced, and never post, vote or message. An extension on the owner's own logged-in browser (like the Facebook one) is the same idea with the least new infrastructure.
- Either way the output should write into the existing Supabase tables (engagement_lead and a new outcomes table) so GitHub jobs and the dashboard need no tailnet access.
- Jev can score/rank candidates cheaply; Claude should only draft replies for the top few.
