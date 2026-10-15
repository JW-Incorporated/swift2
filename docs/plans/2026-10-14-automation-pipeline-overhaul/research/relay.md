# Research: is the Reddit home relay (HOME_RELAY_URL) alive? (2026-10-14)

## Verdict
Relay NOT CONFIGURED. No HOME_RELAY_URL repo variable or secret exists, and every sampled run logs HOME_RELAY_URL as empty. So the pipeline has no relay to be alive. Whether a relay process runs on the owner's network is UNVERIFIED (not reachable from this session). Community scans succeed at workflow level, but Reddit 429s GitHub IPs and the awareness lane mostly cools down or aborts on the first 429.

## Evidence
Workflow references (.github/workflows):
- community-awareness-scan.yml:8, :70 (env from vars.HOME_RELAY_URL)
- community-crawl.yml:27-30, :89
- concert-photo-sourcing.yml:3, :78 (separate open ask)
Scripts:
- scripts/community/awareness-fetch.mjs:9-12, :69-79: relay is ONE fallback attempt per failed request (budget 3); without the var "the fallback is simply absent" (silent skip).
- scripts/community/awareness-scan.mjs:281: relayUrl = process.env.HOME_RELAY_URL || null
- scripts/community/crawl.mjs:38-43 (optional, unset by default); :263-289 probeHomeRelay; logs "home-relay not configured — full-tree fetch disabled" and continues RSS-only.
- community-scan.yml has no relay reference (direct Reddit).

Runs (gh run list, last 30 each):
- community-scan: 30 success. Latest 5: 10-14T13:44Z (38574276275), 10-13T16:00Z, 10-12T17:56Z, 10-11T14:55Z, 10-10T14:28Z. Log: "scanned 5 subreddit(s), inserted 4 new lead(s)." Direct Reddit, no relay.
- community-awareness-scan: 30 success. Latest 5: 10-15T00:57Z (38662940274), 10-14T22:42Z (38649435930), 10-14T19:44Z (38626142916), 10-14T15:32Z (38590226992), 10-14T10:38Z (38551000667).
  - 38662940274: "lane cooling down after a Reddit 429 - made no requests"; 0 candidates; relayUsed 0.
  - 38649435930: used 2, strikes 1, rateLimited 1, aborted true; r/popheads 429; r/TaylorSwiftTheories 200, 25 posts, all too-old; 0 inserted.
  - 38626142916, 38551000667: cooling down, 0 requests.
  - 38590226992: 5 candidates, 2 inserted; used 2, rateLimited 1, aborted true.
  - 38516830616 (10-14T05:28Z): 5 candidates, 5 inserted; used 2, rateLimited 1, aborted true.
  - Every log read: "HOME_RELAY_URL: " blank; relayUsed 0 everywhere.
- community-awareness-deliver: 21 success, 9 skipped (workflow_run); latest 5 all skipped.
- community-inbox: 30 success.
- community-mailer: 26 success, 4 skipped; latest 10-14T23:54Z success (38656854296).
- community-crawl: 29 success, 1 failure (2026-09-27T13:00:57Z, run 36320931214, not examined). Latest 5 success: 10-14T12:52Z (38567115116), 10-13, 10-12, 10-11, 10-10.
  - 38567115116: "home-relay not configured - full-tree fetch disabled this run (budget 15)"; RSS r/TaylorSwift, r/TaylorSwiftBookClub, r/TaylorSwiftTheories all 429 and skipped; wrote 100 bundles across 4 subs, 0 relay fetches.

Repo variables (names/dates only): COMMUNITY_CRAWL_ENABLED true (2026-09-22); COMMUNITY_SCAN_ENABLED true (2026-09-07); CONCERT_PHOTO_SOURCING_ENABLED true (2026-09-22). NOT present: HOME_RELAY_URL, COMMUNITY_CRAWL_BUDGET (default 15).
Secrets (names/dates only): no HOME_RELAY_URL; COMMUNITY_ACK_SECRET present (2026-09-25).

Open asks / docs:
- STATE.md:35 "Hermes relay HOME_RELAY_URL" awaiting Joey.
- STATE.md:67 concert-photo-sourcing "(HOME_RELAY_URL ask)".
- STATE.md:90 "HOME_RELAY_URL unknown (Hermes couldn't find) -> later".
- STATE.md:91 "HOME_RELAY_URL is OPTIONAL (Reddit proxy)"; real failure there is Reddit 403 from GH IPs.
- STATE.md:102 "OPEN ASKS to Joey (unanswered): HOME_RELAY_URL for concert-photo-sourcing.yml".
- STATE.md:122 "Open Q to Joey: HOME_RELAY_URL (secret) for concert-photo-sourcing".
- STATE.md:265 "next anon option HOME_RELAY_URL".
- HUMAN-ACTIONS.md: no relay / HOME_RELAY_URL entry.
- docs/decisions.md:225 "next anonymous options are a home relay (HOME_RELAY_URL) on a residential machine or a self-hosted runner, each an owner decision, never a key."
- docs/decisions.md:811-826 is the Hermes doorbell, a different thing.
- docs/community/README.md:90, :152-154 ("neither is built").

Where the relay is documented to run:
- docs/proposals/2026-09-03-reddit-automation-architecture.md:86-87: VPS to a "home PC" over Tailscale (address and port written there, not reproduced). Proposal doc.
- scripts/community/crawl.mjs:40-43: needs a Tailscale-reachable endpoint, "a separate, later provisioning step".
- docs/community/30-day-review-plan.md:116: planned HOME_RELAY_REACHABLE uptime check.
- No doc says the relay is live.

## Traps
- Workflow "success" says nothing about Reddit: crawl's no-relay path and awareness's 429 cooldown both exit 0.
- STATE.md:122 calls HOME_RELAY_URL a secret; it is a repo variable (vars.HOME_RELAY_URL).
- community-scan run 38574276275 logs "COMMUNITY_SCAN_ENABLED is not set - skipping" at 13:44:07Z, yet the same run scanned and inserted 4 leads. Likely an untaken branch; unresolved.
- docs/AUTOMATION.md:207 calls crawl a "bounded home-relay full-tree fetch"; in practice RSS-only.

## UNVERIFIED
- Whether any relay process runs on the owner's network (not checkable here).
- Items fetched across all 30 awareness runs: only 6 logs sampled.
- Mailer/inbox/deliver: status only, content not read.
- Crawl failure run 36320931214 not examined.
