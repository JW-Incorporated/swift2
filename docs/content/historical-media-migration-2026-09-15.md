# Historical authored-media migration

The publication gate began from commit `e3afc2b1` with 48 older moments that had no authored photo URL, thumbnail, video, or social embed. They are migration debt, not compliant examples. The active exemptions in `scripts/lib/moment-media-gate.mjs` pin both each key and the exact SHA-256 of its original item: editing an item requires adding media, and adding a new key is outside this frozen baseline. Remove a row and its code exemption when media is added.

Dates below are event dates. The source is a reference for the story; it does not satisfy the media requirement. Media relevance and rights still require editorial and visual review.

| Stable key | Event date | Story source |
|---|---:|---|
| `the-life-of-a-showgirl.mjs#showgirl-kelce-bratenahl-home` | 2026-09-01 | [News 5 Cleveland (WEWS)](https://www.news5cleveland.com/news/local-news/travis-kelce-buys-lakefront-home-in-bratenahl-east-of-downtown-cleveland-for-5-35-million) |
| `the-life-of-a-showgirl.mjs#showgirl-ashley-taunton-donation` | 2026-08-28 | [Rolling Stone](https://www.rollingstone.com/music/music-news/taylor-swift-donates-50k-mother-hit-by-car-1235617716/) |
| `the-life-of-a-showgirl.mjs#i-knew-it-i-knew-you-toy-story-5-mv-debut` | 2026-08-18 | [Animation Magazine](https://www.animationmagazine.net/2026/08/toy-story-5-launches-on-fandango-with-taylor-swift-mv-debut/) |
| `the-life-of-a-showgirl.mjs#showgirl-greenfield-new-girl-cameo` | 2026-08-14 | [TheWrap](https://www.thewrap.com/creative-content/tv-shows/max-greenfield-taylor-swift-new-girl-cameo/) |
| `the-life-of-a-showgirl.mjs#showgirl-newlyweds-first-date-night-rumored` | 2026-08-09 | [heavy.com](https://heavy.com/sports/nfl/kansas-city-chiefs/travis-kelce-taylor-swift-make-first-appearance-training-camp/) |
| `the-life-of-a-showgirl.mjs#showgirl-swift-music-pulled-from-trump-tiktoks` | 2026-08-07 | [Variety](https://variety.com/2026/music/news/taylor-swift-song-august-removed-trump-tiktok-video-1236830512/) |
| `the-life-of-a-showgirl.mjs#showgirl-wedding-invite-watermark-takedown` | 2026-07-06 | [Yahoo Entertainment](https://www.yahoo.com/entertainment/videos/taylor-swift-wedding-invitation-removed-123225164.html) |
| `the-life-of-a-showgirl.mjs#showgirl-answer-the-call-donation` | 2026-07-02 | [TMZ](https://www.tmz.com/2026/07/02/how-taylor-swift-travis-kelce-charity-donations-are-being-used/) |
| `the-life-of-a-showgirl.mjs#i-knew-it-i-knew-you-country-panel-close` | 2026-06-08 | [Country Insider](https://www.countryinsider.com/news/most-added-taylor-swift-closes-the-country-panel/article_cf99907b-2591-46e5-8c83-312c3520ae86.html) |
| `the-life-of-a-showgirl.mjs#showgirl-operation-breakthrough-holiday-donation` | 2025-12-01 | [Billboard](https://www.billboard.com/music/pop/taylor-swift-operation-breakthrough-kansas-city-donation-1236147218/) |
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
| `midnights.mjs#sitting-with-donna-kelce-as-the-relationship-goes-public` | 2023-09-24 | [TODAY.com](https://www.today.com/popculture/taylor-swift-kansas-city-chiefs-game-travis-kelce-rcna117098) |
| `midnights.mjs#travis-kelce-laughs-off-dating-rumors-on-nfl-network` | 2023-08-02 | [The Kansas City Star](https://kansascity.com/news/local/article280456364.html) |
| `midnights.mjs#a-quiet-split-from-matty-healy-after-a-brief-romance` | 2023-06-05 | [People](https://people.com/music/taylor-swift-matty-healy-relationship-timeline/) |
| `midnights.mjs#leaving-electric-lady-studios-with-matty-healy-and-a-star-st` | 2023-05-16 | [E! Online](https://www.eonline.com/news/1374508/you-wont-calm-down-over-taylor-swift-and-matty-healys-latest-nyc-outing) |
| `midnights.mjs#first-outing-since-the-joe-alwyn-split-dinner-with-the-anton` | 2023-04-11 | [Extra](https://extratv.com/2023/04/11/taylor-swift-steps-out-for-first-time-since-joe-alwyn-split) |
| `midnights.mjs#a-borrowed-joe-alwyn-jacket-at-the-grammys-afterparty` | 2023-02-05 | [People](https://people.com/style/taylor-swift-wears-joe-alwyn-jacket-to-grammys-afterparty/) |
| `midnights.mjs#a-zodiac-easter-egg-for-joe-alwyn-in-the-lavender-haze-video` | 2023-01-27 | [E! Online](https://www.eonline.com/news/1362894/taylor-swift-fans-spot-joe-alwyn-easter-egg-in-lavender-haze-video) |
| `midnights.mjs#an-unrecognized-night-at-preservation-hall-in-new-orleans` | 2022-12-10 | [Sun Herald (McClatchy wire)](https://www.sunherald.com/entertainment/article269923742.html) |
| `midnights.mjs#the-next-project-is-a-movie-searchlight-signs-her-to-direct` | 2022-12-09 | [Variety](https://variety.com/2022/film/news/taylor-swift-feature-directing-debut-searchlight-pictures-1235455606/) |
| `midnights.mjs#joe-alwyn-gives-a-rare-glimpse-into-life-with-taylors-cat-be` | 2022-11-25 | [ELLE](https://www.elle.com/culture/celebrities/a42071335/taylor-swift-boyfriend-joe-alwyn-cat-benjamin/) |
| `folklore.mjs#folklore-album` | 2020-07-24 | [The Recording Academy](https://www.grammy.com/news/taylor-swift-announces-new-surprise-album-folklore-featuring-bon-iver-nationals-aaron/) |
| `1989.mjs#1989-squad` | 2015-01-01 | [Slate (Lexicon Valley)](https://slate.com/human-interest/2015/07/taylor-swift-waka-flocka-and-squadgoals-how-squad-went-from-underdogs-to-queen-bees.html) |
| `1989.mjs#1989-polaroids` | 2014-11-01 | [ABC News](https://abcnews.com/Entertainment/meaning-cover-taylor-swifts-album-1989/story?id=25028609) |
| `1989.mjs#1989-album` | 2014-10-27 | [CBS News](https://www.cbsnews.com/texas/news/new-taylor-swift-album-coming-in-october) |
| `red.mjs#red-snl` | 2012-11-18 | [Wikipedia](https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble) |
| `red.mjs#red-album` | 2012-10-22 | [CBS News](https://www.cbsnews.com/news/taylor-swift-sells-12-million-copies-of-red/) |
| `speak-now.mjs#speak-now-mean` | 2011-03-14 | [CBS News](https://www.cbsnews.com/news/taylor-swifts-mean-takes-aim-at-her-critics/) |
| `speak-now.mjs#speak-now-ballgowns` | 2011-02-01 | [CBS News / 60 Minutes](https://www.cbsnews.com/news/behind-the-scenes-at-a-taylor-swift-concert/) |
| `fearless.mjs#fearless-vmas` | 2009-09-13 | [TIME](https://content.time.com/time/specials/packages/article/0,28804,1922188_1922187_1922190,00.html) |
| `debut.mjs#debut-cowboy-boots` | 2007-04-01 | [CBS News](https://www.cbsnews.com/newyork/news/taylor-swifts-fashion-evolution/) |
