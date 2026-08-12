# Lane 4 — Rumor Desk (unsettled claims and their lifecycle)

**Due:** every other day (even day-of-month). **Cap:** lifecycle queue + new
claims spread across several moments.

READ FIRST, EVERY RUN: `docs/content-ops/rumor-pipeline.md` and
`docs/content-ops/privacy-redlines.md`. The pipeline changed materially on
2026-07-20 — do not work from memory.

**This is the highest-liability lane in the run.** Its redlines are prose rules
that no CI job can enforce, and since 2026-07-25 content reaches the live site
with no human read. If you are unsure, add nothing.

## The bar

Not "is this true enough to publish" — that rejected nearly all current news and
left the Vault unable to cover the present tense. It is: **is this a claim we can
later adjudicate, from someone we can name?**

- CONFIRMED and already happened → file as fact.
- REPORTED BUT UNSETTLED → admit it as a `rumors` entry (status `unconfirmed`,
  with `reportedBy`, `reportedOn`, `url`, `sourceTier`
  official|established|tabloid|social), not as confirmed narrative.

## Still refused, absolutely

- **Claims with no truth value** — "X joked he wasn't invited", "fans are
  saying", reaction round-ups. Nothing can ever resolve them, so the lifecycle
  can never retire them. This filter is what keeps "admit the chaos" from
  becoming "admit everything".
- Third parties' private lives. Anything unattributable.
- **Security arrangements** — including "security tightened around" / "extra
  security", i.e. a CHANGE in protection around a place, not merely the phrase
  "security detail". Health/pregnancy, sexuality, private individuals, minors,
  leaked material, legal accusations outside court records.

## The location rule — capped by PROVENANCE, not tense

Officially announced or documented past → venue level. Speculation or
forward-looking → REGION level only. Her residence → city level. Street
addresses NEVER.

- OK: "reportedly heading to the Caribbean", "plays Wembley on 14 August",
  "photographed leaving Zuma on Tuesday"
- NOT OK: "expected at the Bowery Hotel this weekend" — coarsen or drop

Travel: the fact of travel at region level is fine; never flight numbers, tail
numbers, airports, gates, departure times, or aviation logs. Note in the run log
whenever you coarsened a location.

## Each run, do both

**A. Lifecycle queue.** `node --use-env-proxy scripts/content-engine/run.mjs scan --no-images`,
read `content.rumor-lifecycle` findings (never-checked / gone-quiet / overdue).
CONFIRMED → status `confirmed` + `resolution { on, url, outlet, note }`;
DEBUNKED → same shape; STILL LIVE → leave status, set `lastCheckedOn` to today;
GONE QUIET (45d+, no confirmation or denial) → status `faded`. The citation is
REQUIRED on confirmed/debunked — `validate-content` hard-errors without it.

**BE RIGOROUS ABOUT WHAT ACTUALLY DEBUNKS WHAT.** A claim that invitations
carried NDAs was once marked debunked because Graham Norton said HE had signed
nothing and was joking — that undercuts the story's origin but says nothing
about the invitations. Two different claims. If the debunking does not address
the claim, it is not debunked.

**B. Source new claims.** Read `content.hot-thin-topic` findings, and mine the
news digest:
`gh api repos/JW-Incorporated/swift2/contents/docs/content-ops/news-candidates.md?ref=news-digest --jq .content | base64 -d`
AIM FOR BREADTH — spread across several moments and eras rather than piling more
onto the wedding page, which already carries the most.

## If a source will not fetch

Retry with a browser User-Agent before calling it unverifiable — many outlets
403 default fetchers while serving browsers fine:

```
curl -sL --max-time 25 -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' '<url>'
```

## Confirm the fields survive the serializer

After the orchestrator syncs, confirm your `sourceTier` / `lastCheckedOn` /
`resolution` values actually appear in
`apps/web/lib/longlive/content-vault.generated.ts`. A serializer bug dropped
exactly those fields for a full day (fixed in #948). If they are missing, say so
loudly rather than reporting invisible data as shipped.
