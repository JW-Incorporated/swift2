# Historical authored-media migration

The publication gate began from commit `e3afc2b1` with 48 older moments that had no authored photo URL, thumbnail, video, or social embed. They are migration debt, not compliant examples. The active exemptions in `scripts/lib/moment-media-gate.mjs` pin both each key and the exact SHA-256 of its original item: editing an item requires adding media, and adding a new key is outside this frozen baseline. Remove a row and its code exemption when media is added.

Thirty gaps were filled on September 15 with verified, credited photographs or official videos: ten Showgirl-era items and twenty older historical moments. The remaining migration list contains 18 items.

Dates below are event dates. The source is a reference for the story; it does not satisfy the media requirement. Media relevance and rights still require editorial and visual review.

| Stable key | Event date | Story source |
|---|---:|---|
| `tortured-poets.mjs#a-quiet-fourth-of-july-at-montanas-yellowstone-club` | 2025-07-04 | [Page Six](https://pagesix.com/2025/07/09/celebrity-news/taylor-swift-and-travis-kelce-spent-fourth-of-july-in-montana/) |
| `tortured-poets.mjs#a-surprise-afternoon-at-joe-dimaggio-childrens-hospital` | 2025-06-01 | [CBS News](https://www.cbsnews.com/miami/news/joe-dimaggios-south-florida-cancer-survivor-taylor-swift-visit-eras-tour/) |
| `tortured-poets.mjs#a-sequined-gucci-set-for-a-masters-buyback-dinner-with-selen` | 2025-05-31 | [Marie Claire](https://www.marieclaire.com/fashion/taylor-swift-gucci-sequin-matching-set-selena-gomez-reunion-new-york/) |
| `tortured-poets.mjs#a-rare-public-reunion-in-philadelphia` | 2025-05-11 | [PEOPLE](https://people.com/taylor-swift-travis-kelce-in-philadelphia-for-first-public-spotting-in-months-11732745) |
| `tortured-poets.mjs#super-bowl-lix-with-the-haim-sisters-and-ice-spice` | 2025-02-09 | [ABC News](https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-super-bowl-2025/story?id=118535158) |
| `tortured-poets.mjs#a-field-kiss-after-the-afc-championship-win` | 2025-01-26 | [People](https://people.com/travis-kelce-taylor-swift-tell-each-other-i-love-you-after-chiefs-win-8780926) |
| `tortured-poets.mjs#back-at-arrowhead-for-the-divisional-round-in-a-chanel-tweed` | 2025-01-18 | [People](https://people.com/taylor-swift-cheers-travis-kelce-kansas-city-chiefs-playoff-game-8774616) |
| `tortured-poets.mjs#a-new-years-eve-kiss-in-kansas-city` | 2024-12-31 | [Marca](https://marca.com/en/nfl/kansas-city-chiefs/2025/01/04/6778bff4268e3e26178b457a.html) |
| `tortured-poets.mjs#a-red-faux-fur-coat-back-at-arrowhead` | 2024-12-21 | [USA Today](https://www.usatoday.com/story/entertainment/music/2024/12/21/taylor-swift-chiefs-texans-game/77006838007) |
| `tortured-poets.mjs#a-second-straight-nyc-date-night-hand-in-hand` | 2024-10-12 | [People](https://people.com/taylor-swift-and-travis-kelce-cute-nyc-dinner-date-8727621) |
| `tortured-poets.mjs#a-plaid-vivienne-westwood-corset-for-monday-night-football` | 2024-10-07 | [People](https://people.com/taylor-swift-serves-sexy-cheerleader-to-support-travis-kelce-chiefs-game-8715641) |
| `tortured-poets.mjs#a-pizza-date-night-in-brooklyn-after-the-chiefs-opener` | 2024-09-06 | [E! Online](https://www.eonline.com/news/1406999/taylor-swift-and-travis-kelce-arrive-at-nyc-dinner-in-style-after-chiefs-win) |
| `tortured-poets.mjs#rhode-island-reunion-for-blake-livelys-birthday-weekend` | 2024-08-24 | [People](https://people.com/everyone-who-joined-taylor-swift-travis-kelce-in-rhode-island-celebrity-guests-8701057) |
| `tortured-poets.mjs#an-eighth-record-breaking-wembley-show-closes-the-european-l` | 2024-08-20 | [BBC News](https://www.bbc.co.uk/news/articles/cr5nr3n6epvo) |
| `tortured-poets.mjs#a-kiss-goodbye-after-the-final-amsterdam-eras-tour-show` | 2024-07-06 | [TODAY](https://www.today.com/popculture/music/taylor-swift-travis-kelce-amsterdam-eras-tour-rcna160532) |
| `tortured-poets.mjs#travis-bikes-around-amsterdam-before-the-show` | 2024-07-06 | [Yahoo Entertainment](https://www.yahoo.com/entertainment/travis-kelce-rides-bike-amsterdam-181438609.html) |
| `tortured-poets.mjs#a-surprise-eras-tour-stage-debut-in-a-tuxedo-and-top-hat` | 2024-06-23 | [CNN](https://www.cnn.com/2024/06/23/entertainment/taylor-swift-travis-kelce-on-stage) |
| `tortured-poets.mjs#instagram-official-a-backstage-selfie-at-wembley` | 2024-06-21 | [People](https://people.com/taylor-swift-travis-kelce-party-4am-london-eras-tour-stage-debut-8667987) |
