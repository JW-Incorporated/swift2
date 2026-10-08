# Era Secrets — every era entry teaches a fan something they didn't know

**Status: APPROVED as founder decision (Joey, 2026-07-15, in-session:
"whatever good ideas you come up with… log them as decisions from me to
integrate into the site"). Decision entry in docs/decisions.md; Marjorie
owns sequencing/routing of the tickets.**
Joey's product thesis, verbatim intent: *"I would like every fan who comes
to the website, goes into an era, immediately to learn something they
didn't know. If a fan can learn something they didn't know, they will
ascribe value to the website."*

The seed insight was the Track 5 tradition. Research below confirms it and
finds a family of similar catalog-wide patterns — the raw material. Then:
five ways to build it into the product, with a recommendation.

## Part 1 — The researched patterns (all sourced; content desk verifies before shipping)

1. **The Track 5 tradition** — the fifth track of every album is its most
   emotionally raw song, confirmed by Taylor herself (Instagram Live,
   summer 2019): "I was just kind of putting a very vulnerable, personal,
   honest, emotional song as track five… Because you noticed this, I kind
   of started to put the songs that were really honest, emotional,
   vulnerable, and personal as track five." Fans first spotted it around
   Red ("All Too Well"). The full line: Cold As You → White Horse → Dear
   John → All Too Well → I Know Places*… → Delicate → The Archer → my
   tears ricochet → tolerate it → You're On Your Own, Kid → So Long,
   London → (TLOAS's track 5). A deliberate, artist-confirmed thread
   through every single era. (Billboard, TIME, Nylon rankings exist.)
2. **Track 13, the grandparents' seat** — 13 is her lucky number (born
   Dec 13; turned 13 on Friday the 13th; first album went gold in 13
   weeks), and on the sister albums the 13th track is a grandparent
   tribute: folklore's "epiphany" (grandfather Dean Swift, Guadalcanal)
   and evermore's "marjorie" (grandmother Marjorie Finlay, the opera
   singer — whose actual voice sings backing vocals on the track).
   (Newsweek, E!, Rolling Stone.)
3. **The liner-note codes — and the 1989 inversion** — from the debut
   through Red, the printed lyrics of every song hid a message spelled in
   capitalized letters (e.g. "22" spells her four best friends' names).
   For 1989 she inverted the code — the message hid in the LOWERCASE
   letters. The codes stop entirely at reputation, itself a statement.
   This is a per-song, per-era decoded secret for six straight eras.
   (Billboard's full decoded guides exist per album.)
4. **How every era ends** — the closing-track arc: album after album ends
   on healing or renewal after whatever the album put you through — Begin
   Again after Red's heartbreak, Clean after 1989, New Year's Day as
   reputation's quiet exhale, Daylight's "you are what you love" after
   Lover. A pattern most fans feel but few have seen stated.
5. **"seven" at seven** — folklore's childhood-memory song sits at track
   7, sung by a narrator remembering being 7 — and it debuted at #7 on
   Billboard's Hot Rock & Alternative chart. Fan analyses also map an
   8-structure across folklore (her 8th album).
6. **The already-famous tier** (site should still tell them well): music
   video easter eggs announcing the next project, era color language,
   vault-track puzzles, the scarf. These anchor the feature for casual
   fans while 1–5 serve the superfans.

Sources gathered 2026-07-15 (verify before authoring): Billboard track-5
ranking + liner-notes guides, TIME on So Long London, Nylon motif guide,
Newsweek folklore/evermore connections, E! on Marjorie Finlay, Rolling
Stone on "marjorie", Taylor Swift fandom wiki (hidden messages), Wikipedia
("Seven"). Full URLs in the session log; content desk re-sources per the
two-outlet rule when authoring.

## Part 2 — Five ways to build it in

1. **The Era Secret card (RECOMMENDED as the feature).** The first thing
   inside every era, above the timeline: one compact, sourced,
   genuinely-obscure fact — rotating on a deterministic daily cycle (same
   secret for everyone that day; curated feel, return-visit hook, zero
   runtime LLM). Each era gets a pool of 5–10 secrets; the card links
   deeper (to the track, the egg, the thread). Directly implements Joey's
   thesis at the exact moment he named: era entry.
2. **The Track Five pill.** In every era's Track Guide, track 5 wears a
   small "Track Five" badge; tapping it tells the tradition (with
   Taylor's quote) and rails across all thirteen track-fives — cross-era
   navigation through one confirmed thread. Same mechanic reusable for
   track-13 lore on folklore/evermore.
3. **Liner-note secrets as egg content.** The decoded per-song messages
   (debut → 1989) are a ready-made egg vein: one egg per song for six
   eras, straight into the #686 density wave, rendered in the song's
   dossier. Highest content-per-effort ratio in this doc.
4. **"How every era ends" as a thread.** The closing-track arc becomes a
   small thread (or Invisible Strings/#445 atlas entry) — one beat per
   era, each linking the closer's dossier.
5. **Secrets progress.** The existing localStorage progress layer counts
   secrets a visitor has uncovered ("23 of 87 secrets found") — turns the
   whole site into the scavenger hunt Taylor herself trained the fandom
   for. Ship after 1–3 prove out.

## Sequencing recommendation

Content first, chrome second: (a) author the secrets pools + liner-note
eggs (#685/#686 waves absorb this doc's Part 1), (b) ship the Era Secret
card, (c) Track Five pill, (d) thread + progress later. (a)+(b) alone
fulfill the thesis. Approved by Joey 2026-07-15; Marjorie decides the
run order within this sequencing and routes the tickets to desks.
