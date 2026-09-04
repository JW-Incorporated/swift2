// Sourcing note: switched from a deliberately non-identifying naming
// convention to real names on 2026-07-10 (see docs/decisions.md) — the Love
// Story thread's whole premise is "who was she with, when," so hiding names
// defeated the feature. `Relationship` doesn't yet have a `sources` field
// (a schema change landing separately); until it does, each entry below
// carries a `// Sources:` comment so the grounding is visible in-repo.
// Dates verified via web research 2026-07-10, not from memory — see the
// per-entry comments for the specific caveats where public reporting is
// genuinely imprecise (Mayer's end date, Alwyn's start date).
export const RELATIONSHIPS = [
  {
    id: 'rel-jonas',
    name: 'Joe Jonas',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Joe_Jonas_Raleigh_928_%28cropped%29.jpg/330px-Joe_Jonas_Raleigh_928_%28cropped%29.jpg',
      credit: 'NotAnotherAKA · CC BY-SA 4.0',
      alt: 'Portrait of Joe Jonas.',
    },
    start: '2008-07-01',
    end: '2008-10-15',
    eraIds: ['debut', 'fearless'],
    songs: [
      { title: 'Forever & Always', relatedId: 'song:forever-and-always' },
      { title: 'The Way I Loved You', relatedId: 'song:the-way-i-loved-you' },
    ],
    // Sources: Jonas ended it via a 27-second phone call, later confirmed by
    // Swift on The Ellen DeGeneres Show; she said the breakup coincided with
    // his next relationship (Camilla Belle). "Forever & Always" is the
    // publicly understood direct response song. https://www.billboard.com/music/pop/joe-jonas-taylor-swift-a-post-breakup-timeline-8514830/
    note: 'A brief, high-profile summer romance that ended in a 27-second phone call — and fueled half of Fearless.',
  },
  {
    id: 'rel-lautner',
    name: 'Taylor Lautner',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Taylor_Lautner_by_Gage_Skidmore.jpg/330px-Taylor_Lautner_by_Gage_Skidmore.jpg',
      credit: 'Gage Skidmore · CC BY-SA 3.0',
      alt: 'Portrait of Taylor Lautner.',
    },
    start: '2009-09-01',
    end: '2009-12-01',
    eraIds: ['fearless'],
    songs: [{ title: 'Back to December', relatedId: 'song:back-to-december' }],
    // Sources: met filming Valentine's Day (2009); consistently spotted
    // together Sept-Nov 2009 (VMAs, hockey games); "Back to December" is
    // Swift's own on-record apology song about this relationship.
    // https://www.billboard.com/music/music-news/taylor-lautner-talks-taylor-swift-relationship-call-her-daddy-1235556301/
    note: 'A fall romance that began on a film set — the rare apology song points back to this one.',
  },
  {
    id: 'rel-mayer',
    name: 'John Mayer',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/JohnMayerin2019.jpg/330px-JohnMayerin2019.jpg',
      credit: 'Thatcommonkid · CC BY-SA 4.0',
      alt: 'Portrait of John Mayer.',
    },
    start: '2009-12-01',
    end: '2010-02-01',
    eraIds: ['fearless'],
    songs: [{ title: 'Dear John', relatedId: 'song:dear-john' }],
    // Sources: reported as an official couple from Dec 2009; end date is
    // genuinely imprecise in public reporting (some outlets cite a Feb 2010
    // split; Mayer publicly presented Swift an award with warm remarks in
    // June 2010) — using the earlier, more-cited Feb 2010 window rather than
    // asserting false precision. https://hollywoodlife.com/feature/taylor-swift-john-mayer-relationship-timeline-5130309/
    note: 'Brief and complicated — "Dear John" is seven minutes long for a reason.',
  },
  {
    id: 'rel-gyllenhaal',
    name: 'Jake Gyllenhaal',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Jake_Gyllenhaal_2019_by_Glenn_Francis.jpg/330px-Jake_Gyllenhaal_2019_by_Glenn_Francis.jpg',
      credit: 'Toglenn · CC BY-SA 4.0',
      alt: 'Portrait of Jake Gyllenhaal.',
    },
    start: '2010-10-01',
    end: '2011-01-01',
    eraIds: ['fearless', 'speak-now'],
    songs: [
      { title: 'All Too Well (10 Minute Version)', relatedId: 'song:all-too-well-10-minute-version' },
      { title: 'The Moment I Knew', relatedId: 'song:the-moment-i-knew' },
      {
        title: 'We Are Never Ever Getting Back Together',
        relatedId: 'song:we-are-never-ever-getting-back-together',
      },
    ],
    // Sources: spotted together backstage at SNL Oct 2010; split confirmed
    // early Jan 2011. "All Too Well" is Swift's own on-record most personal
    // song, per her introduction to it at multiple Eras Tour shows.
    // https://www.yahoo.com/entertainment/music/articles/taylor-swift-dating-history-jake-172100349.html
    note: 'Three months in late 2010 — "All Too Well" is the definitive artifact.',
  },
  {
    id: 'rel-kennedy',
    name: 'Conor Kennedy',
    start: '2012-07-01',
    end: '2012-10-01',
    eraIds: ['speak-now'],
    songs: [],
    // Sources: met at a July 4th party, confirmed couple by late July 2012;
    // amicable October 2012 split, reportedly due to Kennedy still being in
    // high school and long-distance strain. https://www.eonline.com/news/357246/taylor-swift-and-conor-kennedy-breakup-anatomy-of-a-split
    note: 'A summer romance near the Kennedy family compound in Hyannis Port — barely left a lyrical trace.',
  },
  {
    id: 'rel-styles',
    name: 'Harry Styles',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg/330px-HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg',
      credit: 'Raph_PH · CC BY 2.0',
      alt: 'Portrait of Harry Styles.',
    },
    start: '2012-12-01',
    end: '2013-01-07',
    eraIds: ['red'],
    songs: [
      { title: 'Style', relatedId: 'song:style' },
      { title: 'Out of the Woods', relatedId: 'song:out-of-the-woods' },
      { title: 'I Know Places', relatedId: 'song:i-know-places' },
    ],
    // Sources: first photographed together early Dec 2012; breakup reported
    // Jan 7 2013 during a British Virgin Islands trip. Songs are all 1989
    // tracks (fed directly into that album's sessions).
    // https://hollywoodlife.com/feature/taylor-swift-and-harry-styles-complete-relationship-timeline-5180276/
    note: 'A headline-making New Year’s romance that fed directly into the 1989 sessions.',
  },
  {
    id: 'rel-harris',
    name: 'Calvin Harris',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Calvin_Harris_-_Press_Image_1.tif/lossy-page1-330px-Calvin_Harris_-_Press_Image_1.tif.jpg',
      credit: 'Sony BMG · CC BY 3.0',
      alt: 'Portrait of Calvin Harris.',
    },
    start: '2015-03-01',
    end: '2016-06-01',
    eraIds: ['1989'],
    songs: [{ title: 'This Is What You Came For' }],
    // Sources: first public confirmation ~late March 2015 (Wikipedia-cited
    // timeline); breakup reported by People June 1 2016, confirmed by CNN
    // June 2-3 2016. Swift's uncredited co-writing credit on "This Is What
    // You Came For" (as "Nils Sjoberg") was revealed after the split.
    // https://www.cnn.com/2016/06/02/entertainment/taylor-swift-calvin-harris-split
    note: '15 months. A secret co-writing credit became a whole story.',
  },
  {
    id: 'rel-hiddleston',
    name: 'Tom Hiddleston',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Tom_Hiddleston_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg/330px-Tom_Hiddleston_at_the_2024_Toronto_International_Film_Festival_%28cropped%29.jpg',
      credit: 'Kevin Payravi · CC BY-SA 4.0',
      alt: 'Portrait of Tom Hiddleston.',
    },
    start: '2016-06-15',
    end: '2016-09-06',
    eraIds: ['1989', 'reputation'],
    songs: [{ title: 'Getaway Car', relatedId: 'song:getaway-car' }],
    // Sources: first publicly documented June 15 2016 (The Sun published
    // photos); split reported by People/Us Weekly Sept 6 2016.
    // https://www.billboard.com/music/pop/taylor-swift-tom-hiddleston-relationship-timeline-7424146/
    note: 'The "Hiddleswift" summer — "Getaway Car" and reputation were already loading.',
  },
  {
    id: 'rel-alwyn',
    name: 'Joe Alwyn',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Joseph_Alwyn.jpg/330px-Joseph_Alwyn.jpg',
      credit: 'H7ndrx · CC0',
      alt: 'Portrait of Joe Alwyn.',
    },
    start: '2016-11-12',
    end: '2023-04-08',
    eraIds: ['reputation', 'lover', 'folklore', 'evermore', 'midnights'],
    songs: [
      { title: 'Call It What You Want', relatedId: 'song:call-it-what-you-want' },
      { title: 'Lover', relatedId: 'song:lover' },
      { title: 'cardigan', relatedId: 'song:cardigan' },
      { title: 'exile', relatedId: 'song:exile' },
      { title: 'champagne problems', relatedId: 'song:champagne-problems' },
      { title: 'Sweet Nothing', relatedId: 'song:sweet-nothing' },
    ],
    // Sources: start date is the least-precise in this dataset — the first
    // solid public sighting was Swift attending Alwyn's "Billy Lynn's Long
    // Halftime Walk" premiere Nov 12 2016 (used here); some fan-reconstructed
    // timelines claim an earlier September 2016 start, but neither Swift nor
    // Alwyn ever confirmed exact timing, so the more-verifiable premiere date
    // is used rather than asserting false precision. Split reported April 8
    // 2023 by Entertainment Tonight; Alwyn later called it "six and a half
    // years" that "ran its course." "Sweet Nothing" and "cardigan"/"exile"
    // are co-written under Swift's "William Bowery" pseudonym, confirmed as
    // a joint credit with Alwyn per the Long Pond Studio Sessions
    // documentary (Disney+, 2020).
    // https://www.etonline.com/joe-alwyn-breaks-his-silence-on-taylor-swift-breakup-i-have-made-peace-with-that-227482
    note: 'Six and a half quiet years — reputation, Lover, folklore, evermore, and Midnights were all written inside it.',
  },
  {
    id: 'rel-kelce',
    name: 'Travis Kelce',
    image: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5%2C_2023_-_P20230605AS-0902_%28cropped%29.jpg/330px-Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5%2C_2023_-_P20230605AS-0902_%28cropped%29.jpg',
      credit: 'Adam Schultz · Public domain',
      alt: 'Portrait of Travis Kelce.',
    },
    start: '2023-09-24',
    end: null,
    eraIds: ['midnights', 'ttpd', 'tloas'],
    songs: [
      { title: 'Karma (feat. Ice Spice)', relatedId: 'song:karma' },
      { title: 'Is It Over Now? (Taylor’s Version)', relatedId: 'song:is-it-over-now' },
      { title: 'So High School', relatedId: 'song:so-high-school' },
    ],
    // Sources: Kelce publicly invited Swift via his "New Heights" podcast in
    // July 2023 after a friendship-bracelet mishap at an Eras Tour show;
    // Swift told TIME "by the time I went to that first game, we were a
    // couple" — that first Chiefs game was Sept 24 2023, used here as the
    // relationship start. Engaged Aug 26 2025; married July 3 2026 at
    // Madison Square Garden. https://www.billboard.com/lists/taylor-swift-travis-kelce-relationship-timeline/
    note: 'The friendship bracelet, the games, the engagement, the Madison Square Garden wedding — the resolution.',
  },
];
