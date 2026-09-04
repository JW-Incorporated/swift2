// Solo/single stretches between the relationships above — first-class
// entries (not derived gaps) so the Love Story thread can answer "who she
// wasn't with" as well as "who she was." Dates verified 2026-07-10 against
// the same research pass as RELATIONSHIPS; gaps under ~1 month between
// adjacent relationships (where public reporting isn't precise enough to
// place a meaningful boundary) are folded into the neighboring relationship
// rather than represented as a separate sliver.
export const SINGLE_PERIODS = [
  {
    id: 'single-early',
    start: '2006-01-01',
    end: '2008-07-01',
    eraIds: ['debut'],
    songs: [
      { title: 'Tim McGraw', relatedId: 'song:tim-mcgraw' },
      { title: 'Our Song', relatedId: 'song:our-song' },
      { title: 'Teardrops on My Guitar', relatedId: 'song:teardrops-on-my-guitar' },
    ],
    context:
      'By the start of this chapter, Taylor had already bet on Nashville: Scott Borchetta saw her at the Bluebird Cafe and made the 15-year-old Big Machine\'s first signing. Her self-titled debut arrived in October 2006 with her name on every writing credit, turning the crushes and near-misses of high school into country songs before her dating life became a public storyline. "Tim McGraw" began as a math-class goodbye, "Teardrops on My Guitar" came from an unreturned crush, and the ninth-grade talent-show song "Our Song" became her first country No. 1. That long solo runway matters because the voice arrived before the celebrity mythology: she made looking in from the outside feel universal, then built the career that would put every future love story under a microscope.',
    sources: [
      { name: 'The Bluebird Cafe', url: 'https://bluebirdcafe.com/cool_timeline/taylor-swift/', reliability: 5, type: 'official' },
      { name: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-debut-album-anniversary-7550054/', reliability: 4, type: 'reputable_press' },
      { name: 'CBS News', url: 'https://www.cbsnews.com/news/second-cup-cafe-taylor-swift/', reliability: 4, type: 'reputable_press' },
    ],
    note: 'Rising as a teenage songwriter — writing about love mostly from the outside looking in, before any of it was public.',
  },
  {
    id: 'single-2008',
    start: '2008-10-15',
    end: '2009-09-01',
    eraIds: ['debut', 'fearless'],
    songs: [
      { title: 'You Belong with Me', relatedId: 'song:you-belong-with-me' },
      { title: 'The Best Day', relatedId: 'song:the-best-day' },
    ],
    context:
      'She entered this stretch just after the publicly discussed Joe Jonas breakup, and the Fearless rollout immediately moved the focus back to the work. Released on November 11, 2008, Fearless carried teenage longing beyond country radio through "Love Story" and "You Belong with Me" while still centering the family memory of "The Best Day." By April 2009 she was opening her first headlining tour with a sold-out arena in Evansville, then carrying the show through North America, England, and Australia. This was no holding pattern between relationships: she went from breakout country act to arena headliner inside the ten-month window, with the album that would later make her the youngest Album of the Year winner at the time.',
    sources: [
      { name: 'TIME', url: 'https://time.com/4928223/taylor-swift-beefs-guide/', reliability: 4, type: 'reputable_press' },
      { name: 'The Recording Academy', url: 'https://www.grammy.com/news/deep-10-taylor-swifts-fearless/', reliability: 5, type: 'official' },
      { name: 'The Boot', url: 'https://theboot.com/taylor-swift-fearless-tour-first-headlining-tour-2009/', reliability: 3, type: 'reputable_press' },
    ],
    note: 'Channeled the Jonas breakup into Fearless, which became the most-awarded country album in history.',
  },
  {
    id: 'single-2010',
    start: '2010-02-01',
    end: '2010-10-01',
    eraIds: ['fearless', 'speak-now'],
    songs: [
      { title: 'Mine', relatedId: 'song:mine' },
      { title: 'Speak Now', relatedId: 'song:speak-now' },
    ],
    note: 'Wrote all of Speak Now solo — a deliberate statement of authorship after whispers that others wrote her hits.',
  },
  {
    id: 'single-2011',
    start: '2011-01-01',
    end: '2012-07-01',
    eraIds: ['speak-now'],
    songs: [
      { title: 'Mean', relatedId: 'song:mean' },
      { title: 'Long Live', relatedId: 'song:long-live' },
      { title: 'Enchanted', relatedId: 'song:enchanted' },
    ],
    context:
      'All 14 standard-edition songs on Speak Now carried Taylor\'s sole writing credit, a deliberate answer to critics who doubted her authorship. When the world tour opened in Singapore in February 2011, she turned those songs into full-scale theatre: costume changes, aerialists, fireworks, and a balcony suspended over the crowd. The run reached 110 shows across 19 territories, sold more than 1.6 million tickets, and closed in Auckland in March 2012 after grossing $123.7 million. In the middle of it, "Mean" won two Grammys, giving the album\'s answer-to-the-critics story a literal awards-show payoff. The solo stretch made independence visible: the writer of every song was also the headliner carrying them around the world.',
    sources: [
      { name: 'The Recording Academy', url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/', reliability: 5, type: 'official' },
      { name: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-announces-speak-now-world-tour-950374/', reliability: 4, type: 'reputable_press' },
      { name: 'Pollstar', url: 'https://news.pollstar.com/2012/03/27/taylor-swift-ends-world-tour-in-auckland/', reliability: 4, type: 'trade_press' },
      { name: 'Touring Data', url: 'https://touringdata.wordpress.com/2020/12/11/taylor-swift-recap/', reliability: 3, type: 'trade_database' },
    ],
    note: 'The Speak Now World Tour, fully solo.',
  },
  {
    id: 'single-2012',
    start: '2012-10-01',
    end: '2012-12-01',
    eraIds: ['speak-now', 'red'],
    songs: [
      { title: '22', relatedId: 'song:22' },
      { title: 'Begin Again', relatedId: 'song:begin-again' },
    ],
    note: 'The Red rollout — finishing the album that reinvented her sound.',
  },
  {
    id: 'single-2013',
    start: '2013-01-07',
    end: '2015-03-01',
    eraIds: ['red', '1989'],
    songs: [
      { title: 'Shake It Off', relatedId: 'song:shake-it-off' },
      { title: 'Blank Space', relatedId: 'song:blank-space' },
      { title: 'Bad Blood', relatedId: 'song:bad-blood' },
    ],
    context:
      'Taylor spent the first half of this chapter carrying Red around the world, then used the long solo runway for a full identity reset: she moved from Nashville to Manhattan and presented 1989 as her first official pop album. "Shake It Off" opened the era at No. 1, then "Blank Space" replaced it at the top, making her the first woman to succeed herself on the Hot 100 while turning the serial-dater caricature into satire. By the end of this chapter, the famous-friend circle the press would call the "squad" was taking shape; its tour cameos and the star-packed "Bad Blood" video arrived just after this solo window closed, but their iconography grew out of the same friend-first reset. The visibility had a cost: later retrospectives describe the 1989 peak as oversaturation, with her omnipresence and celebrity circle becoming targets in the backlash that hardened in 2016. reputation\'s retreat did not come from nowhere - it was the shadow cast by a pop reinvention that had briefly made her look untouchable.',
    sources: [
      { name: 'Billboard', url: 'https://billboard.com/articles/news/6150193/taylor-swift-red-all-time-country-tour', reliability: 4, type: 'reputable_press' },
      { name: 'TIME', url: 'https://time.com/3578249/taylor-swift-interview/', reliability: 4, type: 'reputable_press' },
      { name: 'Slate', url: 'https://slate.com/culture/2014/12/taylor-swift-blank-space-is-back-to-back-number-1-hit-with-shake-it-off-is-this-her-imperial-moment.html', reliability: 4, type: 'reputable_press' },
      { name: 'Slate Lexicon Valley', url: 'https://slate.com/human-interest/2015/07/taylor-swift-waka-flocka-and-squadgoals-how-squad-went-from-underdogs-to-queen-bees.html', reliability: 4, type: 'reputable_press' },
      { name: 'Associated Press', url: 'https://apnews.com/article/a4002b50f70b5899a846baf3e20de5ab', reliability: 4, type: 'reputable_press' },
    ],
    note: 'The "squad" era — peak pop, moving to New York, becoming untouchable.',
  },
  {
    id: 'single-2016',
    start: '2016-09-06',
    end: '2016-11-12',
    eraIds: ['1989', 'reputation'],
    songs: [],
    note: 'A brief, quiet stretch between very public relationships.',
  },
  {
    id: 'single-2023',
    start: '2023-04-08',
    end: '2023-09-24',
    eraIds: ['midnights'],
    songs: [
      { title: 'The Smallest Man Who Ever Lived', relatedId: 'song:the-smallest-man-who-ever-lived' },
      { title: 'loml', relatedId: 'song:loml' },
      { title: 'So Long, London', relatedId: 'song:so-long-london' },
    ],
    context:
      'News of the Joe Alwyn breakup arrived on April 8, 2023, three weeks into the Eras Tour, though reporting said the six-year relationship had ended quietly before the public learned. The tour kept moving while a new record took shape around it, but this was not a clean five-month no-romance bubble: multiple outlets linked Taylor to Matty Healy in May and reported it over by early June, while neither artist confirmed a relationship on the record. Taylor later said The Tortured Poets Department contained writing from the previous two years, making these months one intense section of its gestation rather than the album\'s whole origin story. When the record arrived, "So Long, London" became its clearest goodbye to the Alwyn years, while "loml" supplied a broader loss-of-my-life elegy without Taylor naming its subject. What looks like a gap on the relationship timeline was a compressed transition: touring through one ending, writing through another reported attachment, and building the album that would preserve both kinds of fallout.',
    sources: [
      { name: 'CNN', url: 'https://www.cnn.com/2023/04/09/entertainment/taylor-swift-joe-alwyn-break-up/index.html', reliability: 4, type: 'reputable_press' },
      { name: 'Los Angeles Times', url: 'https://www.latimes.com/entertainment-arts/music/story/2023-06-05/taylor-swift-matty-healy-break-up-report', reliability: 4, type: 'reputable_press' },
      { name: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-2am-surprise-secret-double-album-the-tortured-poets-department-1235660643/', reliability: 4, type: 'reputable_press' },
      { name: 'E! News', url: 'https://www.eonline.com/news/1399781/untangling-taylor-swifts-heartbreaking-goodbye-to-joe-alwyn-in-so-long-london', reliability: 4, type: 'reputable_press' },
      { name: 'NBC News', url: 'https://www.nbcnews.com/pop-culture/celebrity/joe-alwyn-taylor-swift-interview-rcna157354', reliability: 4, type: 'reputable_press' },
    ],
    note: 'Five months — the Eras Tour already mid-run, The Tortured Poets Department already being written.',
  },
];
