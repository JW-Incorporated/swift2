# Completeness pilot — award-show appearances (T17, Tier 1)

Date: 2026-07-09. Ground truth: Wikipedia's "List of awards and nominations
received by Taylor Swift" article, fetched and cross-checked via two
follow-up searches for years where the article summary was thin (VMA
2015–2026 detail, 2023 VMA sweep breakdown, AMA hiatus years, CMA recent
years). Scope per the brief: Grammys, VMAs, AMAs, CMAs, BBMAs — every year
she attended/performed/won/was nominated, not just wins.

Corpus checked: `supabase/seed/content/*.mjs` (grepped title/source_title
lines for award-show keywords across all 10 era files) and
`apps/web/lib/longlive/content.ts` (grepped same keywords). No seed
`awards/**` directory exists yet — coverage lives entirely inside
era-moment files as fashion/moment items, not as a distinct award-show
content type.

**Coverage key:** Yes = a dedicated moment/item exists naming the show, year,
and result. Partial = the show/year is mentioned only as a side detail on an
unrelated item (usually a red-carpet fashion entry) with no coverage of the
actual win/nomination/performance. No = absent entirely.

## Grammy Awards

| Year | What happened | Source | Covered? |
|---|---|---|---|
| 2008 (50th) | Best New Artist — nominated | Wikipedia awards list | No |
| 2010 (52nd) | *Fearless* wins Album of the Year + Best Country Album; "White Horse" wins Best Female Country Vocal Performance + Best Country Song; "You Belong with Me" nominated (Record/Song/Best Female Pop Vocal) | Wikipedia awards list | Partial (`fearless.mjs` covers the fashion/hair for "four Grammys" night, not the wins themselves as a moment) |
| 2012 (54th) | "Mean" wins Best Country Solo Performance + Best Country Song; *Speak Now* nominated Best Country Album | Wikipedia awards list | Partial (`speak-now.mjs`: "Mean wins two Grammys the same night" exists as a title) — Yes for this one |
| 2013 (55th) | "We Are Never Ever Getting Back Together" nominated Record of the Year; "Safe & Sound" wins Best Song Written for Visual Media | Wikipedia awards list | Partial (`red.mjs` covers "Safe & Sound wins the first Grammy of the Red era" — Yes for that win; WANEGBT nomination not covered) |
| 2014 (56th) | *Red* nominated Album of the Year + Best Country Album; "Highway Don't Care," "Begin Again" nominated | Wikipedia awards list | Partial ("Red goes into the Grammys with two nominations — and leaves with neither" exists in `red.mjs` — Yes) |
| 2015 (57th) | "Shake It Off" nominated Record/Song/Best Pop Solo Performance | Wikipedia awards list | No |
| 2016 (58th) | *1989* wins Album of the Year + Best Pop Vocal Album; "Bad Blood" wins Best Music Video, nominated Best Pop Duo/Group Performance; "Blank Space" nominated Record/Song/Best Pop Solo | Wikipedia awards list | Partial (`1989.mjs` covers the red-carpet look at "the 2016 Grammys" but not the AOTY win as its own moment) |
| 2018 (60th) | "Better Man" nominated Best Country Song; "I Don't Wanna Live Forever" nominated | Wikipedia awards list | No |
| 2019 (61st) | *Reputation* nominated Best Pop Vocal Album | Wikipedia awards list | No |
| 2020 (62nd) | "Lover" nominated Song of the Year; "You Need to Calm Down" nominated Best Pop Solo Performance; *Lover* nominated Best Pop Vocal Album | Wikipedia awards list | No |
| 2021 (63rd) | *Folklore* wins Album of the Year (nominated Best Pop Vocal Album too); "Cardigan," "Exile," "Beautiful Ghosts" nominated | Wikipedia awards list | Yes — `folklore.mjs`: "folklore makes her the first woman to win Album of the Year three times" |
| 2022 (64th) | *Evermore* nominated Album of the Year | Wikipedia awards list | No |
| 2023 (65th) | *All Too Well: The Short Film* wins Best Music Video; "All Too Well (10 Min)" nominated Song of the Year; "I Bet You Think About Me," "Carolina" nominated | Wikipedia awards list | No dedicated moment found |
| 2024 (66th) | *Midnights* wins Album of the Year + Best Pop Vocal Album; "Anti-Hero" nominated Record/Song/Best Pop Solo; "Karma" nominated | Wikipedia awards list | Yes — `midnights.mjs`: "A record fourth Album of the Year Grammy, for Midnights" |
| 2025 (67th) | *TTPD* nominated Album of the Year (7th nom) + Best Pop Vocal Album; "Fortnight" nominated Record/Song/Best Music Video; "Us" nominated | Wikipedia awards list | Yes — `tortured-poets.mjs`: "A record 7th Album of the Year nomination, for TTPD"; "Fortnight's Grammy double" |
| 2026 | *The Life of a Showgirl* — **not eligible**, missed the 2026 eligibility window by 34 days | `the-life-of-a-showgirl.mjs` sources (Variety/Billboard-style coverage) | Yes — already well documented as a non-nomination explainer |

## MTV Video Music Awards

| Year | What happened | Source | Covered? |
|---|---|---|---|
| 2008 | "Our Song" wins Video of the Year + Female Video of the Year | Wikipedia awards list | No |
| 2009 | "Love Story" wins Video of the Year + Female Video of the Year (also the Kanye West interruption during the Best Female Video acceptance — different category per Wikipedia's table framing, but same ceremony) | Wikipedia awards list | Yes — `fearless.mjs`: "Wins Best Female Video, then Kanye West takes the mic"; `content.ts` `fearless-vmas` id |
| 2010 | "You Belong with Me" nominated Video/Female Video of the Year | Wikipedia awards list | No |
| 2011 | "Mine" wins Video of the Year | Wikipedia awards list | No |
| 2012 | "Safe & Sound," "Ours" nominated | Wikipedia awards list | No |
| 2013 | "Begin Again," "We Are Never Ever Getting Back Together" nominated | Wikipedia awards list | No |
| 2014 | "Highway Don't Care," "Red" nominated | Wikipedia awards list | No |
| 2015 | "Bad Blood" (feat. Kendrick Lamar) wins Video of the Year; Swift presents the Video Vanguard Award to Kanye West | Rolling Stone, "Taylor Swift Makes History at 2023 VMAs" (recap cites the record) | Partial — `1989.mjs` covers the VMAs red-carpet "Bad Blood" squad look, not the win itself |
| 2019 | "You Need to Calm Down" wins Video of the Year | Rolling Stone / Billboard VMA recap coverage | No dedicated moment (only the AMA win for the same song is covered in `lover.mjs`) |
| 2022 | *All Too Well: The Short Film* wins Video of the Year; Swift announces *Midnights* on the VMAs red carpet | Wikipedia awards list; `evermore.mjs` source_title "2022 MTV Video Music Awards" already cited | Partial — the source is present but not surfaced as its own moment/win |
| 2023 | Nine wins in one night (Video/Song/Artist of the Year, Best Pop, Best Direction, Best Cinematography, Best Visual Effects, Show of the Summer, Album) for "Anti-Hero" — ties the single-night record | Rolling Stone, "Taylor Swift Makes History at 2023 VMAs"; NBC News VMAs live-blog | Yes — `midnights.mjs`: "A record-tying 9 VMA wins in one night" |
| 2024 | "Fortnight" (feat. Post Malone) wins Video of the Year — 3rd straight year winning VOTY, 7 wins total, ties Beyoncé for most all-time VMA wins | Rolling Stone / Billboard, "Taylor Swift Thanks Boyfriend Travis Kelce...2024 VMAs" | No dedicated moment found (Fortnight is covered in `tortured-poets.mjs` for other reasons, not this win) |
| 2025 | Nominated Artist of the Year — did not attend; award went to Lady Gaga | Forbes, "Taylor Swift Skips 2025 VMAs, Stays Tied For Record Wins"; Today.com | No |

## American Music Awards

| Year | What happened | Source | Covered? |
|---|---|---|---|
| 2007 | Favorite Country Female Artist — nominated | Wikipedia awards list | No |
| 2008 | Favorite Country Female Artist — won | Wikipedia awards list | Partial (`debut.mjs` covers "A studded Catherine Malandrino dress...at the 2007 AMAs" — wrong year attached to the fashion note relative to this win; not the same event) |
| 2009 | Artist of the Year, Favorite Pop/Rock Female, Favorite Country Female, Favorite Adult Contemporary — all won; *Fearless* wins Favorite Country Album | Wikipedia awards list | No dedicated moment |
| 2010 | Favorite Country Female Artist — won | Wikipedia awards list | Partial (`speak-now.mjs` covers "Blunt bangs debut at the 2010 American Music Awards" — fashion only) |
| 2011 | Artist of the Year, Favorite Country Female — won; *Speak Now* wins Favorite Country Album | Wikipedia awards list | Partial (`speak-now.mjs` "A gold Reem Acra gown...at the American Music Awards" — fashion only, year not stated) |
| 2012 | Favorite Country Female Artist — won | Wikipedia awards list | No |
| 2013 | Artist of the Year, Favorite Pop/Rock Female, Favorite Country Female — won; *Red* wins Favorite Country Album | Wikipedia awards list | No |
| 2014 | Dick Clark Award for Excellence — won | Wikipedia awards list | No |
| 2015 | *1989* wins Favorite Pop/Rock Album; "Blank Space" wins Song of the Year; Artist of the Year nominated (not won) | Wikipedia awards list | No |
| 2018 | Artist of the Year, Favorite Pop/Rock Female — won; *Reputation* wins Favorite Pop/Rock Album; Reputation Stadium Tour wins Tour of the Year | Wikipedia awards list | No |
| 2019 | Artist of the Decade, Artist of the Year, Favorite Pop/Rock Female, Favorite Adult Contemporary — won; "You Need to Calm Down" wins Favorite Music Video; *Lover* wins Favorite Pop/Rock Album | Wikipedia awards list | Yes — `lover.mjs`: "Artist of the Decade, and a record 29 AMA wins" |
| 2020 | Artist of the Year, Favorite Pop/Rock Female — won; "Cardigan" wins Favorite Music Video | Wikipedia awards list | No |
| 2021 | Favorite Pop/Rock Female — won; *Evermore* wins Favorite Pop/Rock Album; Artist of the Year nominated | Wikipedia awards list | Partial (`folklore.mjs`: "Taylor Swift Wins Top AMA; MIA Due to 'Recording All My Old Music'" — a source_title referencing this ceremony, no full moment) |
| 2022 | Artist of the Year, Favorite Country Female, Favorite Pop/Rock Female — won; *ATW: The Short Film* wins Favorite Music Video; *Red (TV)* wins Favorite Country Album + Favorite Pop Album | Wikipedia awards list | Yes — `reputation.mjs`: "23 AMA wins — more than any woman in history"; `midnights.mjs`: "Six-for-six at the AMAs, and past 40 career wins" |
| 2023–2024 | **No ceremony held** — AMAs on a two-year hiatus after ABC's broadcast rights expired in 2022 | Wikipedia (American Music Awards main article) | N/A — correctly absent from corpus, nothing to add |
| 2025 (51st, revived) | Artist of the Year, Favorite Touring Artist, Favorite Female Pop Artist, *TTPD* Album of the Year + Favorite Pop Album, "Fortnight" Collaboration of the Year — all nominated | Wikipedia awards list | No |
| 2026 | Artist of the Year, Favorite Female Pop Artist, *The Life of a Showgirl* Album of the Year + Favorite Pop Album, "The Fate of Ophelia" (Song of the Year/Best Pop Song/Best Music Video), "Elizabeth Taylor" Song of the Summer — all nominated | Wikipedia awards list | No dedicated moment (results TBD if ceremony hasn't aired yet — **unverified whether this ceremony has occurred as of this report**, flag before adding) |

## Country Music Association (CMA) Awards

| Year | What happened | Source | Covered? |
|---|---|---|---|
| 2007 | Horizon Award — won (first major award) | Wikipedia awards list | Yes — `debut.mjs`: "Wins her first CMA Award — the Horizon Award" |
| 2008 | Female Vocalist of the Year — nominated | Wikipedia awards list | Partial (`debut.mjs` covers "A black satin Elvira mermaid gown for her first CMA Awards" — fashion, not the nomination itself) |
| 2009 | Entertainer of the Year, Female Vocalist of the Year, International Artist Achievement — won; *Fearless* wins Album of the Year; "Love Story" wins Music Video of the Year | Wikipedia awards list | Yes — `fearless.mjs` source_title "Taylor Swift Wins Entertainer of the Year and More at 2009 CMA Awards" |
| 2010 | Female Vocalist of the Year — nominated | Wikipedia awards list | Partial (`speak-now.mjs`: "A red Monique Lhuillier gown at the 2010 CMA Awards" — fashion only) |
| 2011 | Entertainer of the Year — won; *Speak Now* nominated Album of the Year; "Mean" nominated | Wikipedia awards list | No dedicated moment (Entertainer of the Year win itself not covered as its own item) |
| 2012 | Entertainer of the Year, Female Vocalist of the Year — nominated; "Safe & Sound" nominated Musical Event of the Year | Wikipedia awards list | Partial (`red.mjs`: "A Jenny Packham lace gown blooms with red at the 2012 CMAs" — fashion only) |
| 2013 | Pinnacle Award, International Artist Achievement — won; "Highway Don't Care" wins Musical Event of the Year + Music Video of the Year | Wikipedia awards list | No dedicated moment |
| 2014 | Female Vocalist of the Year — nominated | Wikipedia awards list | No |
| 2015–2016 | No nominations found | Wikipedia awards list (gap consistent with her pivot away from country) | N/A |
| 2017 | "Better Man" (written for Little Big Town) wins Song of the Year — a songwriting credit, not a performance/attendance win | Wikipedia awards list | No |
| 2018 | "Babe" (with Sugarland) nominated Video of the Year | Wikipedia awards list | No |
| 2022 | "I Bet You Think About Me" nominated Video of the Year | Wikipedia awards list | No |
| 2023–2025 | No nominations confirmed via search — likely genuinely absent given her non-country output in this window | Could not find a Wikipedia/press entry confirming any CMA nomination or attendance in these years | **Unverified/likely N/A** — do not add without a direct source |

## Billboard Music Awards

| Year | What happened | Source | Covered? |
|---|---|---|---|
| 2011 | Top *Billboard* 200 Artist, Top Country Artist — won; *Speak Now* wins Top Country Album | Wikipedia awards list | No dedicated moment |
| 2012 | Woman of the Year — won | Wikipedia awards list | No |
| 2013 | Top Artist, Top Female Artist, Top *Billboard* 200 Artist, Top Country Artist, Top Digital Songs Artist — won; *Red* wins Top *Billboard* 200 Album + Top Country Album; "We Are Never Ever Getting Back Together" wins Top Country Song | Wikipedia awards list | Yes — `1989.mjs`: "Calvin Harris and Taylor go public at the Billboard Music Awards" (contextual, different year); `red.mjs` fashion item exists for "the Billboard Music Awards" but not the sweep itself as a moment |
| 2014 | Top Social Artist, Top Country Artist — nominated | Wikipedia awards list | No |
| 2015 | Top Artist, Top Female Artist, Top *Billboard* 200 Artist, Top Hot 100 Artist, Top Digital Songs Artist — won; *Billboard* Chart Achievement Award — won; "Shake It Off" wins Top Streaming Song (Video) | Wikipedia awards list | Partial (`1989.mjs`: "A sparkling white Balmain jumpsuit for the Billboard Music Awards" — fashion, contextually near "Bad Blood premieres at the BBMAs" which covers the Vevo record but not the awards Swift herself won) |
| 2016 | Top Touring Artist — won; several nominations | Wikipedia awards list | No |
| 2018 | Top Female Artist — won; *Reputation* wins Top Selling Album | Wikipedia awards list | No |
| 2019 | Top Female Artist, Top Touring Artist — nominated | Wikipedia awards list | No |
| 2020 | Several nominations, no wins found | Wikipedia awards list | No |
| 2021 | Top *Billboard* 200 Artist, Top Female Artist — won | Wikipedia awards list | No |
| 2022 | Top *Billboard* 200 Artist, Top Country Artist, Top Country Female Artist — won; *Red (TV)* wins Top Country Album | Wikipedia awards list | No |
| 2023 | Top Artist, Top Female Artist, Top *Billboard* 200 Artist, Top Country Female Artist, Top Radio Songs Artist, Top Songs Sales Artist, Top Hot 100 Songwriter, Top Global 200 Artist (+Excl. US) — won; "Anti-Hero" wins Top Selling Song | Wikipedia awards list | No dedicated moment |
| 2024 | Top Artist, Top Female Artist, Top *Billboard* 200 Artist, Top Hot 100 Artist, Top Radio Songs Artist, Top Streaming Songs Artist, Top Hot 100 Songwriter, Top Global 200 Artist (+Excl. US) — won; *TTPD* wins Top *Billboard* 200 Album | Wikipedia awards list | No |

---

## Summary

- **Ground truth compiled:** roughly 45 award-show-years across the five
  shows (Grammys: 16 ceremonies 2008–2026; VMAs: 15 ceremonies 2008–2025;
  AMAs: 19 ceremony-years 2007–2026, with 2023–2024 correctly having no
  ceremony; CMAs: ~15 ceremony-years with nominations 2007–2022, likely none
  since; BBMAs: 14 ceremonies 2011–2024).
- **Genuinely well-covered as dedicated moments (not just fashion
  side-mentions):** roughly 10 entries across all five shows — mostly the
  headline records (folklore's 3rd AOTY, Midnights' 4th AOTY, the 2023 VMA
  sweep, the AMA "Artist of the Decade," the CMA Horizon Award/Entertainer of
  the Year debut).
- **The dominant pattern:** the corpus already *mentions* most major
  ceremonies, but almost always as a red-carpet fashion caption (`RUNWAY_LOOKS`-style
  entries), not as a moment describing the win/nomination/performance itself.
  This mirrors §A2/§C.1's finding elsewhere in the audit — the plumbing (an
  award-show moment type with year/category/result/source) doesn't exist as
  its own content shape; it's folded into fashion notes instead.
- **Missing entirely, no mention found:** the large majority of individual
  Grammy nomination-only years (2008, 2015, 2018–2020, 2022–2023, 2025),
  most AMA years before 2019, most BBMA years, and most VMA years outside the
  headline wins (2010–2014, 2019, 2024, 2025).
- **Could not verify / flagged, do not add on this report's authority:**
  (1) whether the 2026 AMA ceremony (51st, nominations listed above) has
  actually aired as of this writing — results unconfirmed; (2) any CMA
  nomination or attendance for 2023–2025 — no source found, plausible she was
  simply absent given her non-country recent output, but not confirmed either
  way.
- No content was added to any seed file or `content.ts` — this is a
  report-only pass per the T17 process. A follow-up content lane should
  decide whether award-show wins/nominations get their own `ContentItem`
  type (recommended, since folding them into fashion items under-serves both)
  and then fill the verified gaps above, skipping the two unverified items
  until confirmed.
