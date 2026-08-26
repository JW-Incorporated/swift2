# Era Depth QA Spot-Check - 2026-07-09

Scope: read-only QA sample of `supabase/seed/content/{debut,1989,reputation,lover,midnights,tortured-poets}.mjs`.

Method: sampled 3 items per file, prioritizing slugged/deeper items with richer bodies or new source/photo metadata. I spot-checked public sources and URL plausibility; this is not exhaustive source-by-source verification.

## Flags

- `debut.mjs` / `rascal-flatts-opening-run` - **wrong date/album-age claim.**
  - Seed says the call came `Oct. 17, 2006` and also says the album was "nine-day-old" / "eight days after her debut album dropped."
  - Public release info gives the debut album release as **Oct. 24, 2006**, while the diary-source article says the diary entry was **Oct. 18, 2006** and that she got the call the day before.
  - Fix: the Rascal Flatts call happened before the debut album release, not after. Source: Taste of Country diary article; album release info: Wikipedia/Taylor Swift album page.

- `debut.mjs` / `bonfires-amplifiers-fall-leg` - **primary source URL failed in spot-check.**
  - `https://www.countrystandardtime.com/news/newsitem.asp?xid=454` returned 404 through browser fetch.
  - The broad claim is plausible from public tour listings: Bonfires & Amplifiers ran through the listed fall dates, and Taylor Swift is listed among opening acts. Still, the cited primary URL should be replaced or revalidated.

- `reputation.mjs` / `rep-wembley-guest-nights` - **minor precision issue.**
  - Niall Horan on June 22, 2018 and Robbie Williams on June 23, 2018 check out.
  - The context's "90,000-voice 'Angels'" wording looks overstated/unsupported for the 2018 reputation stop. Box-office data I found lists **143,427 total** across the two Wembley shows, not 90,000 for the Robbie night. Recommend softening to "Wembley-wide" or adding a direct source for the 90,000 figure.

- `tortured-poets.mjs` / `Engagement photos: a Polo Ralph Lauren dress in the garden` - **photo-credit mismatch.**
  - The outfit facts and Marie Claire URL check out: article updated Aug. 27, 2025; announcement photos posted Aug. 26; Polo Ralph Lauren dress, Louis Vuitton Isola sandals, Cartier watch, Travis in Ralph Lauren black polo/khaki shorts.
  - Seed photo credits say `Getty Images`, but Marie Claire credits the engagement/proposal images to `Taylor Swift`; only unrelated couple-style/date-night imagery in the article is Getty. Recommend correcting the credits for those two engagement-photo URLs.

- `tortured-poets.mjs` / `vienna-shows-cancelled` - **ticket-count wording suspicious.**
  - Dates, venue, cancellation, alleged ISIS-linked plot, 19-year-old suspect, bomb/explosive materials, and Swift's later "new sense of fear" / "tremendous guilt" statement check out.
  - The title/snippet's "250,000 unused tickets" is not what I could corroborate. Sources more commonly say three sold-out shows, more than 200,000 expected in/around the stadium, or about 65,000 ticketed per day plus non-ticketed crowds outside. Recommend replacing with "three sold-out Vienna shows" or "200,000+ expected fans" unless a ticket-specific 250,000 source is found.

## Sample Verdicts

### `debut.mjs`

- `rascal-flatts-opening-run` - **Flagged.** Eric Church/Rascal Flatts replacement story is real, but the seed's "album already out / nine-day-old" timing is wrong against the Oct. 24, 2006 album release and Oct. 17/18 tour-call diary date. Sources: Taste of Country, Wikipedia.

- `nsai-songwriter-artist-2007` - **Looks fine.** NSAI Songwriter/Artist of the Year and "third in four years" framing checks against The Boot; youngest-winner framing is plausible via Taylor Swift biographical summaries. Sources: The Boot, Wikipedia.

- `bonfires-amplifiers-fall-leg` - **Flagged for source URL.** Tour/date/opening-act facts look plausible, but the cited Country Standard Time URL returned 404 in the spot-check. Sources: Wikipedia tour listing; cited Country Standard Time URL failed.

### `1989.mjs`

- `1989-secret-sessions` - **Looks fine.** 89-fan Secret Sessions, Swift-selected fans, LA/Nashville/NYC/Rhode Island/London locations, homemade treats, and no-leak framing match public retrospectives. Sources: NYLON, Wikipedia.

- `1989-kobe-staples-banner` - **Looks fine.** Aug. 21, 2015 Staples Center banner, 16 sold-out shows, Kobe Bryant appearance, and Ryan Tedder same-night cameo are consistent with public tour/set-list records. Sources: Billboard/CBS Sports URLs are plausible; Wikipedia tour listing corroborates.

- `1989-nils-sjoberg-reveal` - **Looks fine.** July 13, 2016 revelation, Nils Sjoberg pseudonym, Swift backing vocals, secrecy rationale, and Calvin Harris tweet response match public reports. Sources: Billboard/Variety URLs are plausible; Pitchfork, Vanity Fair, Wikipedia corroborate.

### `reputation.mjs`

- `rep-secret-sessions` - **Looks fine.** 500 fans, four locations/homes, GMA footage, selected-by-Swift framing, and no leaks are corroborated. Sources: ABC News, Billboard URL plausible.

- `rep-wembley-guest-nights` - **Minor flag.** Guest dates and songs check out; the "90,000-voice" attendance wording should be sourced or softened. Sources: Billboard/NME URLs plausible; Reputation Stadium Tour public tour data.

- `rep-signs-with-republic-umg` - **Looks fine.** Nov. 19, 2018 Republic/UMG deal, future-master ownership, and non-recoupable Spotify-equity payout clause check out. Sources: Time, Variety/Rolling Stone URLs plausible.

### `lover.mjs`

- `big-machine-sale-worst-case-scenario` - **Looks fine.** June 30, 2019 Big Machine/Ithaca sale, over-$300M framing, first-six-albums masters, and "worst case scenario" reaction check out. Sources: Time, Pitchfork, Variety/Billboard URLs plausible.

- `gma-rerecording-pledge` - **Looks fine.** Aug. 22, 2019 GMA interview, Lover release the next day, first-owned-album framing, and Nov. 2020 re-record eligibility for albums 1-5 are supported. Source: Good Morning America.

- `singles-day-gala-shanghai` - **Looks fine.** Nov. 10, 2019 Alibaba Singles' Day Shanghai performance and the three-song set (`ME!`, piano `Lover`, `You Need to Calm Down`) are corroborated. Sources: Billboard/Forbes URLs plausible; Wired/Wikipedia/Axios corroborate surrounding event.

### `midnights.mjs`

- `swift-quake-seattle` - **Looks fine.** July 22-23, 2023 Lumen Field seismic activity, 2.3-magnitude comparison, stronger/longer than Beast Quake, and roughly 144k across two nights are supported. Sources: CBS News, Entertainment Weekly, Lumen Field public records.

- `eras-tour-beige-book` - **Looks fine.** The July 12, 2023 Federal Reserve Beige Book explicitly credits Taylor Swift concerts with Philadelphia's strongest hotel-revenue month since the pandemic began. Source: Federal Reserve Beige Book.

- `melbourne-mcg-biggest-shows` - **Looks fine.** Feb. 16-18, 2024 MCG shows, 96,000 per night, 288,000 total, and "biggest shows I've ever played on a tour" quote check out. Sources: People, Guardian, MCG/Eras Tour public records.

### `tortured-poets.mjs`

- `Engagement photos: a Polo Ralph Lauren dress in the garden` - **Flagged for photo credit only.** Fashion/source facts check out, but seed photo credits should not say Getty for the engagement photos if using the Marie Claire images credited to Taylor Swift. Source: Marie Claire.

- `vienna-shows-cancelled` - **Flagged for ticket-count wording.** Core cancellation/security facts check out; "250,000 unused tickets" should be replaced unless directly sourced. Sources: TIME, CBS News, People, public Eras Tour/Vienna plot summaries.

- `masters-buyback-shamrock` - **Looks fine.** May 30, 2025 announcement, Shamrock buyback, roughly $360M reported price, included masters/videos/artwork/unreleased songs, Rep TV barely started, and debut re-record completed all check out. Source: Billboard.

