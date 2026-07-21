// Per-song dossiers for The Life of a Showgirl (issue #440 Phase 1), keyed by
// track slug and attached in the-life-of-a-showgirl.mjs. Drafted by ChatGPT
// (codex exec) against docs/briefs/tloas-dossier-brief-2026-07-10.md, then
// fact-checked by Claude 2026-07-10: all source URLs resolve; the Eldest
// Daughter confirmed-tier claim verified against Swift's Amazon Music track
// commentary (via Capital FM); every other confirmed tier traces to a direct
// statement already sourced in the era seed file; internal song:/moment: ids
// are asserted resolvable by apps/web/lib/longlive/tracks.test.ts.
// No lyric quotations. No live-performance entries until a real performance
// is sourced (verified 2026-07-10: no tour, no live TV performance of these
// songs yet — and Super Bowl LX halftime was Bad Bunny, not Swift).
export default {
  "the-fate-of-ophelia": {
    whyItMatters: [
      "The opener gives the era its thesis in one image: a doomed literary woman pulled out of the water instead of left there. That reversal matters because it lets Swift use a familiar tragic figure without surrendering to tragedy; the song is about rescue, but also about authorship, because she takes a story whose ending everyone knows and changes what the ending means.",
      "It also became the commercial and visual spine of the album. As the lead single, it debuted at No. 1, later led the Hot 100 for 10 non-consecutive weeks, and arrived with a self-directed video that premiered inside the theatrical release-party event before moving to YouTube. For a record built around the tension between stagecraft and private life, this is the track where the showgirl imagery, the album cover, and the romantic rescue arc lock together."
    ],
    meaning: {
      confirmed: [
        "Swift has framed the song as a deliberate reversal of Shakespeare's Ophelia: instead of a woman disappearing into the water, this narrator is saved and gets to outlive the story assigned to her."
      ],
      supported: [
        "The album cover and video keep returning to the same water-and-stage language, so the song reads as the album's doorway: public spectacle on the surface, private salvation underneath.",
        "The rescue is romantic, but the larger move is literary. Swift is not just borrowing Hamlet; she is revising it, turning a tragic symbol into a figure of survival."
      ]
    },
    connections: [
      {
        relatedId: "song:love-story",
        label: "Love Story",
        why: "Both songs rewrite canonical doomed-love stories into survivable romance; Love Story turns the Romeo-and-Juliet frame into youthful wish fulfillment, while Ophelia revisits that move with a darker, more theatrical adult vocabulary."
      },
      {
        relatedId: "song:opalite",
        label: "Opalite",
        why: "Ophelia starts the album with rescue, while Opalite turns that rescue into sustained brightness: one is being pulled from the water, the other is learning to live in the light after it."
      },
      {
        relatedId: "moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op",
        label: "The Showgirl Portraits",
        why: "The portrait set makes the Ophelia image the era's first visual promise, with the half-submerged album cover preparing listeners for the opener's reversal before they hear a note."
      },
      {
        relatedId: "moment:vault-tloas-the-official-release-party-of-a-showgirl-turns-movie-theater",
        label: "The Official Release Party of a Showgirl",
        why: "The video premiered inside the theatrical release-party event, turning the song from album opener into the first communal visual experience of the era."
      }
    ],
    sources: [
      {
        name: "The Fate of Ophelia",
        url: "https://en.wikipedia.org/wiki/The_Fate_of_Ophelia"
      },
      {
        name: "Taylor Swift Releases The Fate of Ophelia Video",
        url: "https://variety.com/2025/music/news/taylor-swift-fate-of-ophelia-music-video-premiere-youtube-1236540694/"
      },
      {
        name: "Taylor Swift Embodies Showgirls Across Eras in The Fate of Ophelia Video",
        url: "https://www.rollingstone.com/music/music-news/taylor-swift-the-fate-of-ophelia-video-1235441075/"
      },
      {
        name: "Taylor Swift's The Fate of Ophelia No. 1 on Hot 100 for 10th Week",
        url: "https://www.billboard.com/lists/taylor-swift-hot-100-the-fate-of-ophelia-10th-week/"
      }
    ]
  },

  "elizabeth-taylor": {
    whyItMatters: [
      "Elizabeth Taylor is the album's clearest fame song: a glamorous surface with a frightened question underneath. By invoking one of the twentieth century's most scrutinized actresses, Swift gives herself a mirror big enough to hold romance, legacy, jewelry, headlines, and the private cost of being watched while trying to be loved.",
      "Its placement matters, too. The seed notes identify it as the first song written for the album, and the track works like a tonal keystone: after Ophelia's rescue, this is the question of whether a woman this famous can actually keep what rescued her."
    ],
    meaning: {
      confirmed: [
        "Swift has said the song began before the rest of the album existed, with a refrain and piano draft sent to Max Martin and Shellback."
      ],
      supported: [
        "The Elizabeth Taylor comparison lets the song treat celebrity romance as both fantasy and burden: a public woman measuring whether love can survive the machinery that turns her life into spectacle.",
        "The song's drama is not simply wanting love; it is wanting a love strong enough not to be intimidated by fame, history, and constant interpretation."
      ]
    },
    connections: [
      {
        relatedId: "song:the-lucky-one",
        label: "The Lucky One",
        why: "Both songs look at fame through an earlier star's shadow, but The Lucky One imagines escape from the machine while Elizabeth Taylor asks whether staying visible can coexist with being truly loved."
      },
      {
        relatedId: "song:clara-bow",
        label: "Clara Bow",
        why: "Clara Bow uses a predecessor's name to expose the entertainment industry's habit of cycling through women; Elizabeth Taylor uses a predecessor's life to ask what happens when the icon is also trying to be a person."
      },
      {
        relatedId: "song:wish-list",
        label: "Wish List",
        why: "Wish List answers Elizabeth Taylor's anxiety from a calmer angle: if Elizabeth Taylor worries fame may scare love away, Wish List imagines love as the only prize that still matters after the prizes are already won."
      },
      {
        relatedId: "moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album",
        label: "Elizabeth Taylor: The First Song",
        why: "The vault moment grounds the song's importance to the album's construction, not just its theme: this was the first piece of the Showgirl puzzle Swift found."
      }
    ],
    sources: [
      {
        name: "Elizabeth Taylor (song)",
        url: "https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)"
      },
      {
        name: "The Meaning Behind Elizabeth Taylor on The Life of a Showgirl",
        url: "https://time.com/7322774/taylor-swift-elizabeth-taylor-life-of-a-showgirl/"
      },
      {
        name: "Taylor Swift's Brilliant New Song Elizabeth Taylor: The Life of Two Showgirls",
        url: "https://www.rollingstone.com/music/music-features/taylor-swift-elizabeth-taylor-life-of-a-showgirl-1235440312/"
      },
      {
        name: "Taylor Swift Releases Elizabeth Taylor Music Video",
        url: "https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/"
      }
    ]
  },

  "opalite": {
    whyItMatters: [
      "Opalite is the album's purest happiness record, but its title keeps that happiness from feeling accidental. The seed file's safest reading is the important one: opalite is man-made, so the song's joy is not a lucky discovery. It is something built on purpose after years of writing love as risk, loss, secrecy, or combat.",
      "Its chart story turned that mood into an era milestone. When Opalite followed The Fate of Ophelia to No. 1 in February 2026, Showgirl became Swift's first album since 1989 to produce two Hot 100 leaders, making the track feel less like an album-cut fan favorite and more like the public's chosen emblem of the record's brightness."
    ],
    meaning: {
      supported: [
        "The title supports a reading of happiness as crafted rather than found: the narrator is not waiting for fate to hand her peace, but choosing and building the conditions for it.",
        "As track three, it functions as the record's open window after the first two songs establish rescue and fame anxiety."
      ],
      fanTheories: [
        "Fans and critics often connect the opal imagery to Travis Kelce's October birth month, but Swift has not confirmed the subject, so that reading belongs here rather than in confirmed meaning."
      ]
    },
    connections: [
      {
        relatedId: "song:the-fate-of-ophelia",
        label: "The Fate of Ophelia",
        why: "They became the album's two No. 1 singles, and they form a narrative pair: Ophelia is the rescue moment, while Opalite is the deliberately built happiness that follows."
      },
      {
        relatedId: "song:daylight",
        label: "Daylight",
        why: "Both songs treat love as a change in atmosphere after darker weather; Daylight names the illumination, while Opalite makes that illumination feel handmade."
      },
      {
        relatedId: "song:begin-again",
        label: "Begin Again",
        why: "Begin Again is about noticing hope return after heartbreak; Opalite sounds like the later stage of that same arc, when hope has become a chosen home rather than a surprise."
      },
      {
        relatedId: "moment:vault-tloas-opalite-follows-ophelia-to-no-1",
        label: "Opalite Follows Ophelia to No. 1",
        why: "The moment captures the song's public afterlife: the fan-favorite optimism became a chart-leading single months after release."
      }
    ],
    sources: [
      {
        name: "Opalite (song)",
        url: "https://en.wikipedia.org/wiki/Opalite_(song)"
      },
      {
        name: "Taylor Swift's Opalite Hits No. 1 on the Hot 100",
        url: "https://www.billboard.com/lists/taylor-swift-opalite-hot-100-number-one/"
      },
      {
        name: "Taylor Swift's Opalite Tops Hot 100, Ties Rihanna",
        url: "https://variety.com/2026/music/news/taylor-swift-opalite-top-hot-100-chart-tied-with-rihanna-1236670506/"
      },
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      }
    ]
  },

  "father-figure": {
    whyItMatters: [
      "Father Figure is the album's sharpest industry-power song. The George Michael interpolation gives it an instantly legible pop-history charge, but Swift's version moves the phrase into a colder arena: mentorship, patronage, leverage, and the moment a protege no longer needs the person who once held the keys.",
      "The clearance story matters because it makes the borrowing feel sanctioned rather than opportunistic. George Michael's estate publicly welcomed the interpolation before release, which turns the song into a rare kind of pop conversation: one artist's famous title becoming the architecture for another artist's story about power."
    ],
    meaning: {
      supported: [
        "The song is best read as a music-industry parable, with father-figure language recast around a mentor or backer whose authority curdles once the younger artist can stand alone.",
        "Because the interpolation is so visible, the song also asks what inheritance means in pop: what an artist takes from the past, what she owes it, and when she gets to transform it."
      ]
    },
    connections: [
      {
        relatedId: "song:the-man",
        label: "The Man",
        why: "The Man attacks gendered power rules head-on; Father Figure narrows the lens to a specific patronage dynamic, where protection and control can be hard to separate."
      },
      {
        relatedId: "song:my-tears-ricochet",
        label: "My Tears Ricochet",
        why: "Both songs dramatize a broken bond in almost mythic terms, but My Tears Ricochet sounds like a funeral for betrayal while Father Figure sounds like the protege walking out with the lesson learned."
      },
      {
        relatedId: "song:look-what-you-made-me-do",
        label: "Look What You Made Me Do",
        why: "Look What You Made Me Do turns public conflict into villain-theater; Father Figure is cooler and more corporate, but both songs understand revenge as performance."
      },
      {
        relatedId: "moment:vault-tloas-father-figure-rebuilds-george-michaels-1988-hit-with-his-est",
        label: "George Michael Estate Blessing",
        why: "The vault moment supplies the key provenance: this was not a hidden resemblance, but a cleared interpolation publicly acknowledged by Michael's estate."
      }
    ],
    sources: [
      {
        name: "No Hesitation: George Michael's Estate Delighted Over Taylor Swift Using Father Figure",
        url: "https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/"
      },
      {
        name: "Taylor Swift Father Figure: George Michael Estate Comments On Song",
        url: "https://www.billboard.com/music/music-news/taylor-swift-father-figure-george-michael-statement-1236081129/"
      },
      {
        name: "Father Figure (Taylor Swift song)",
        url: "https://en.wikipedia.org/wiki/Father_Figure_(Taylor_Swift_song)"
      }
    ]
  },

  "eldest-daughter": {
    whyItMatters: [
      "Eldest Daughter matters because it knowingly steps into the track-five room and changes the furniture. Swift has trained fans to hear track five as the vulnerable pressure point; this song keeps the vulnerability, but the seed and vault material frame its ending as reassurance rather than collapse.",
      "That makes it one of the album's most revealing inversions. The song names the performance of competence - the oldest-child reflex to manage the room, absorb the worry, and seem fine - then lets that performance soften. In a Showgirl era obsessed with what happens offstage, Eldest Daughter is the dressing-room version of strength."
    ],
    meaning: {
      confirmed: [
        "Swift's track commentary framed the song around the gap between the public self and the private self known only to the closest people."
      ],
      supported: [
        "The eldest-daughter reading is about caretaking as identity: the person who learns to hold things together so early that being held can feel unfamiliar.",
        "Its place as track five matters because it answers the tradition from inside it, keeping the emotional exposure while refusing to end in pure devastation."
      ]
    },
    connections: [
      {
        relatedId: "song:all-too-well",
        label: "All Too Well",
        why: "All Too Well is the canonical track-five wound; Eldest Daughter uses the same slot to ask what happens when the wound is met with care instead of left open."
      },
      {
        relatedId: "song:my-tears-ricochet",
        label: "My Tears Ricochet",
        why: "Both songs carry track-five gravity, but My Tears Ricochet turns betrayal into a ghost story while Eldest Daughter turns pressure into a plea to be known privately."
      },
      {
        relatedId: "song:youre-on-your-own-kid",
        label: "You're On Your Own, Kid",
        why: "You're On Your Own, Kid finds self-reliance as survival; Eldest Daughter starts from self-reliance and looks for the permission to stop proving it."
      },
      {
        relatedId: "moment:vault-tloas-eldest-daughter-the-first-track-five-that-ends-somewhere-saf",
        label: "The First Track Five That Ends Somewhere Safe",
        why: "The moment captures the song's specific place in Swift mythology: it is vulnerable because it is track five, and surprising because it lets the narrator be cared for."
      }
    ],
    sources: [
      {
        name: "Making Sense of Eldest Daughter, Taylor Swift's Emotional The Life of a Showgirl Track 5",
        url: "https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/"
      },
      {
        name: "Taylor Swift explains real meaning behind her Eldest Daughter lyrics",
        url: "https://www.capitalfm.com/news/taylor-swift-eldest-daughter-lyrics-meaning/"
      },
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      }
    ]
  },

  "ruin-the-friendship": {
    whyItMatters: [
      "Ruin the Friendship is the album's quietest ache: not public spectacle, not chart conquest, but the private violence of a chance not taken. In a record full of adult certainty, it reaches backward to the high-school almost, where the stakes feel small until time proves they were permanent.",
      "The sourcing line is especially important here. Swift has not named the subject. The Jeff Lang reading is a fan interpretation built from public record and later family comment, so the dossier has to preserve both truths: the theory is meaningful to listeners, and it is still not confirmation."
    ],
    meaning: {
      supported: [
        "The song reads as a regret story about mistaking caution for safety: the narrator protects the friendship in the moment, then has to live with never knowing what honesty might have changed.",
        "Its funeral turn makes the message harsher than a normal almost-love song. The missed kiss becomes a lesson about time, grief, and the false comfort of waiting."
      ],
      fanTheories: [
        "Fans connect the song to Swift's late Hendersonville classmate Jeff Lang, citing public 2010 references and the song's setting, but Swift has not confirmed him as the subject."
      ]
    },
    connections: [
      {
        relatedId: "song:fifteen",
        label: "Fifteen",
        why: "Both songs look back at teenage closeness with adult understanding; Fifteen is about what youth cannot know yet, while Ruin the Friendship is about what adulthood can no longer change."
      },
      {
        relatedId: "song:the-1",
        label: "The 1",
        why: "The 1 treats an alternate life as wistful speculation; Ruin the Friendship makes the alternate life sharper because death closes the door on ever testing it."
      },
      {
        relatedId: "song:marjorie",
        label: "Marjorie",
        why: "Marjorie turns memory into a way of keeping someone present; Ruin the Friendship turns memory into a question the narrator cannot ask the person anymore."
      },
      {
        relatedId: "moment:vault-tloas-ruin-the-friendship-a-regret-from-hendersonville-high",
        label: "A Regret from Hendersonville High",
        why: "The vault moment documents the fan-traced background while keeping the key boundary intact: the Lang connection is moving, public, and unconfirmed."
      }
    ],
    sources: [
      {
        name: "Ruin the Friendship",
        url: "https://en.wikipedia.org/wiki/Ruin_the_Friendship"
      },
      {
        name: "Taylor Swift Ruin The Friendship Lyrics - The Heartbreaking Story That May Have Inspired The Song",
        url: "https://www.forbes.com/sites/monicamercuri/2025/10/03/taylor-swift-ruin-the-friendship-lyrics-the-heartbreaking-story-that-may-have-inspired-the-song/"
      }
    ]
  },

  "actually-romantic": {
    whyItMatters: [
      "Actually Romantic is the album's discourse engine: short, pointed, and built to make listeners argue about where confidence ends and combat begins. Swift's own framing keeps the target unnamed, which is why the song is more interesting as a study of attention than as a guessing game.",
      "The key move is emotional alchemy. Instead of treating hostility as a wound, the narrator treats it as evidence of obsession. That is funny, petty, and defensible all at once, which is why the song sat at the center of the era's loudest fan conversation."
    ],
    meaning: {
      confirmed: [
        "Swift described the song as realizing someone else had been carrying on a one-sided adversarial relationship with her."
      ],
      supported: [
        "The song reframes dislike as a kind of unwanted intimacy: if someone spends that much energy on you, the attention itself becomes the punchline.",
        "Its pop-feud energy works because the subject is deniable. The song can be read as a character study in fixation even when listeners debate the real-world referent."
      ],
      fanTheories: [
        "Fans and critics widely read it as a response to Charli XCX and Sympathy Is a Knife, but Swift has not confirmed Charli as the subject."
      ]
    },
    connections: [
      {
        relatedId: "song:bad-blood",
        label: "Bad Blood",
        why: "Bad Blood turns conflict into a squad-era blockbuster; Actually Romantic is smaller and sharper, less war movie than smirk, but both songs make interpersonal fallout into pop theater."
      },
      {
        relatedId: "song:thank-you-aimee",
        label: "thanK you aIMee",
        why: "Both songs convert resentment into a song that refuses to name its target outright, leaving the audience to parse clues while the narrator controls the frame."
      },
      {
        relatedId: "song:blank-space",
        label: "Blank Space",
        why: "Blank Space weaponizes a caricature the public projected onto Swift; Actually Romantic uses the same judo move on a smaller scale, turning someone else's fixation into her own joke."
      },
      {
        relatedId: "moment:vault-tloas-actually-romantic-the-diss-track-she-frames-as-a-compliment",
        label: "The Diss Track She Frames as a Compliment",
        why: "The vault moment preserves the two-layer reading: Swift's subject-free explanation, and the wider critic/fan debate around the Charli XCX interpretation."
      }
    ],
    sources: [
      {
        name: "Actually Romantic",
        url: "https://en.wikipedia.org/wiki/Actually_Romantic"
      },
      {
        name: "Taylor Swift, Charli xcx Feud Timeline After Actually Romantic Song",
        url: "https://variety.com/2025/music/news/taylor-swift-charli-xcx-feud-actually-romantic-timeline-showgirl-1236538041/"
      },
      {
        name: "Taylor Swift: Was Actually Romantic, Charli XCX Drama Necessary?",
        url: "https://www.rollingstone.com/music/music-features/taylor-swift-actually-romantic-charli-xcx-commentary-1235442867/"
      }
    ]
  },

  "wish-list": {
    whyItMatters: [
      "Wish List is Showgirl's priorities song. After Elizabeth Taylor weighs love against fame's glare, this track sounds like the settled answer: the narrator can name the shiny things people chase and still choose the private thing that cannot be awarded, ranked, or collected.",
      "The seed file frames it as the last song written and the final piece of the album's picture. That matters structurally. It is not a naive love song from someone with no ambition; it is a contentment song from someone whose ambition has already proved itself."
    ],
    meaning: {
      confirmed: [
        "Swift has said Wish List was the last song written for the album and the final piece that completed the record's picture of love as an addition to an already-full life."
      ],
      supported: [
        "The song contrasts public trophies with private stability, making the romance feel chosen rather than needed.",
        "It belongs with the album's broader offstage theme: after the show, the fantasy is not more applause, but someone steady to come home to."
      ]
    },
    connections: [
      {
        relatedId: "song:elizabeth-taylor",
        label: "Elizabeth Taylor",
        why: "Elizabeth Taylor asks whether fame can make love impossible; Wish List answers by making love the only wish that fame cannot satisfy."
      },
      {
        relatedId: "song:paper-rings",
        label: "Paper Rings",
        why: "Paper Rings turns commitment into gleeful anti-luxury; Wish List is less frantic but shares the idea that the real prize is the person, not the status object."
      },
      {
        relatedId: "song:sweet-nothing",
        label: "Sweet Nothing",
        why: "Sweet Nothing finds refuge in a love that does not demand performance; Wish List expands that refuge into a life-priority statement."
      },
      {
        relatedId: "moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel",
        label: "The Life of a Showgirl Arrives",
        why: "The release-day moment grounds the album's deliberately tight 12-song shape, which makes Wish List's final-piece role feel intentional rather than incidental."
      }
    ],
    sources: [
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      },
      {
        name: "Taylor Swift talks new album on New Heights podcast",
        url: "https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce"
      },
      {
        name: "Taylor Swift Unveils The Life of a Showgirl Cover, Sabrina Carpenter Feature",
        url: "https://www.rollingstone.com/music/music-news/taylor-swift-life-of-showgirl-details-cover-new-heights-1235406130/"
      }
    ]
  },

  "wood": {
    whyItMatters: [
      "Wood is where Showgirl lets pleasure be silly, bodily, and superstitious. The seed file identifies it as a horn-driven disco track, and that matters because the song's sound does some of the interpretation: joy arrives with a wink, not a dissertation.",
      "Its place beside Honey also gives the album a small genre-experiment pocket. After years of Swift love songs that treat happiness as fragile, Wood lets fragility become play: the narrator is aware a good thing can be jinxed, but the awareness makes the celebration livelier instead of smaller.",
      "It became the album's most-talked-about track, and not for the superstition: critics fixated on its unmistakable double entendres, splitting hard between delight and eye-rolling — the Guardian filed its 'laid-back take on disco' as a highlight while Pitchfork and others read the winking lyric as the album's cringe risk. The divisiveness never dented its reach: Wood debuted at No. 5 on the Billboard Hot 100 the week all twelve Showgirl songs charted at once, the fifth-highest of the bunch."
    ],
    meaning: {
      confirmed: [
        "Swift has said the song began somewhere innocent — an idea built around knock-on-wood superstition — and only drifted into cheekier territory once she and her collaborators were in the studio, telling Jimmy Fallon she wasn't sure how they 'got here' but loved the result."
      ],
      supported: [
        "The knock-on-wood superstition frames happiness as something the narrator wants to protect without draining the fun out of it.",
        "The disco and horn language support a reading of romance as physical confidence rather than only confession — and the arrangement earns the disco label with live-played Stockholm brass rather than a sample, part of the Max Martin and Shellback studio craft.",
        "The innuendo is why the track became the era's lightning rod: the same brightness that makes it fun makes the double meaning impossible to miss, so the song reads as either the album's most joyful swing or its most self-indulgent, depending on the listener."
      ]
    },
    voices: [
      {
        who: "Taylor Swift",
        context: "The Tonight Show Starring Jimmy Fallon, October 2025",
        note: "Explained that Wood started as a throwback, timeless-sounding idea about knock-on-wood superstition and only got risqué once she and her collaborators started 'vibing' in the studio — hanging her head at the audience's laughter but insisting she loved the song anyway."
      }
    ],
    connections: [
      {
        relatedId: "song:honey",
        label: "Honey",
        why: "The seed pairs Wood and Honey as the album's genre-experiment duo; Wood is the playful superstition side, while Honey is the softer term-of-endearment side."
      },
      {
        relatedId: "song:paper-rings",
        label: "Paper Rings",
        why: "Both songs are commitment songs with a grin. Paper Rings runs on giddy impatience, while Wood turns the fear of jinxing happiness into part of the flirtation."
      },
      {
        relatedId: "song:false-god",
        label: "False God",
        why: "False God uses groove and sensual atmosphere to move a love song out of pure narrative; Wood does something similar with disco brightness and superstition."
      },
      {
        relatedId: "song:glitch",
        label: "Glitch",
        why: "Glitch treats a good relationship as something improbable that somehow happened; Wood treats that same improbability as a reason to knock on wood and keep dancing."
      }
    ],
    sources: [
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      },
      {
        name: "Taylor Swift talks new album on New Heights podcast",
        url: "https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce"
      },
      {
        name: "Taylor Swift explains the meaning of 'Wood' on Fallon",
        url: "https://www.thewrap.com/taylor-swift-wood-meaning-fallon/"
      },
      {
        name: "Wood (song) — chart history and reception",
        url: "https://en.wikipedia.org/wiki/Wood_(song)"
      },
      {
        name: "Taylor Swift makes Hot 100 history with Showgirl's top-12 sweep",
        url: "https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-life-of-a-showgirl-billboard-debut-1236399004/"
      },
      {
        name: "Taylor Swift: The Life of a Showgirl review (The Guardian)",
        url: "https://www.theguardian.com/music/2025/oct/03/taylor-swift-the-life-of-a-showgirl-review"
      }
    ]
  },

  "cancelled": {
    whyItMatters: [
      "Cancelled! is the album's loyalty test. Instead of treating public disgrace as an abstract internet phenomenon, the song puts Swift back in one of her longest-running subjects: what people do when the crowd turns, and whether friendship survives reputational risk.",
      "It matters because Showgirl is otherwise full of chosen happiness, and this track asks what that happiness does with mess. The answer is not a clean defense brief; it is a song about standing near people after the public has decided distance would be safer."
    ],
    meaning: {
      supported: [
        "The song is best read as a critique of fast public judgment and a pledge of loyalty to people who have been through the spectacle of being condemned.",
        "Its exclamation point belongs to the performance layer: cancellation is both a serious social consequence and a word that gets shouted, memed, and merchandised by the same culture doing the judging."
      ]
    },
    connections: [
      {
        relatedId: "song:look-what-you-made-me-do",
        label: "Look What You Made Me Do",
        why: "Look What You Made Me Do is Swift inside the cancellation machine, turning backlash into a persona; Cancelled! looks outward at who gets abandoned when the same machine picks a new target."
      },
      {
        relatedId: "song:this-is-why-we-cant-have-nice-things",
        label: "This Is Why We Can't Have Nice Things",
        why: "Both songs are about the social cost of betrayal and public fallout, but Cancelled! shifts from party-collapse revenge to loyalty under pressure."
      },
      {
        relatedId: "song:mad-woman",
        label: "Mad Woman",
        why: "Mad Woman studies how public narratives punish anger; Cancelled! studies how public narratives punish association, asking who still stands close when judgment becomes contagious."
      },
      {
        relatedId: "song:the-man",
        label: "The Man",
        why: "The Man names double standards directly; Cancelled! turns toward the social process that applies those standards, especially when fame makes judgment feel like a public sport."
      }
    ],
    sources: [
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      }
    ]
  },

  "honey": {
    whyItMatters: [
      "Honey is one of the album's softest gestures, and the softness is the point. The seed frames it as an early song and part of the Wood/Honey genre-experiment pair, with an R&B lean and horn arrangements that helped define the album's new sonic territory.",
      "Where Wood protects joy by joking about superstition, Honey protects it by making tenderness feel deliberate. It is not the grand thesis track, but it deepens the record's offstage argument: after spectacle, a small endearment can carry as much weight as a spotlight."
    ],
    meaning: {
      confirmed: [
        "Swift has said Honey was among the first songs written for the record and helped confirm that the album was moving into new stylistic territory."
      ],
      supported: [
        "The term-of-endearment framing makes the song about trust: sweetness is not weakness, but a choice to let someone speak gently to you.",
        "Its R&B and horn textures move the album's love language away from pure pop sparkle and toward warmth, ease, and touch."
      ]
    },
    connections: [
      {
        relatedId: "song:wood",
        label: "Wood",
        why: "The two songs form the album's genre-experiment pair; Honey is the tender counterpart to Wood's playful superstition."
      },
      {
        relatedId: "song:sweet-nothing",
        label: "Sweet Nothing",
        why: "Both songs value a private softness that asks nothing performative from the narrator; Honey makes that softness sound warmer and more embodied."
      },
      {
        relatedId: "song:lover",
        label: "Lover",
        why: "Lover turns commitment into a room with the lights on; Honey works at a smaller scale, making a pet name feel like its own promise of safety."
      },
      {
        relatedId: "song:peace",
        label: "Peace",
        why: "Peace worries that public chaos may be too much to bring into love; Honey answers with intimacy that feels intentionally gentle despite the noise around it."
      }
    ],
    sources: [
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      },
      {
        name: "Taylor Swift talks new album on New Heights podcast",
        url: "https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce"
      }
    ]
  },

  "the-life-of-a-showgirl-title-track": {
    whyItMatters: [
      "The title track matters because it refuses to end the album alone. Sabrina Carpenter's presence is not decorative; the seed frames the song as a showbiz mentorship story, with a veteran performer named Kitty passing hard-won knowledge to a younger singer watching from the edge of the stage.",
      "That makes the closer the album's thesis in human form. Showgirl begins with a woman rescued from a famous tragic image and ends with one performer teaching another how to survive the lights. It is less a victory lap than a handoff."
    ],
    meaning: {
      confirmed: [
        "Swift has described the song as the story of veteran performer Kitty and a younger singer who studies her."
      ],
      supported: [
        "Casting Sabrina Carpenter supports the mentor-to-successor reading because Carpenter had opened for the Eras Tour before breaking through as a headliner in her own right.",
        "As the closing title track, it turns the album's showgirl metaphor away from costumes and toward transmission: what an older performer can warn, bless, or leave behind."
      ]
    },
    connections: [
      {
        relatedId: "song:clara-bow",
        label: "Clara Bow",
        why: "Clara Bow treats fame succession as an industry pattern that can erase women; The Life of a Showgirl imagines succession as mentorship, with one performer consciously speaking to the next."
      },
      {
        relatedId: "song:nothing-new",
        label: "Nothing New",
        why: "Nothing New fears being replaced by the younger artist; the title track softens that fear by staging the younger artist as a student rather than a threat."
      },
      {
        relatedId: "song:long-live",
        label: "Long Live",
        why: "Long Live preserves the communal glory of a stage era; The Life of a Showgirl looks backstage at what it costs to keep standing there and what wisdom might be passed on."
      },
      {
        relatedId: "moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter",
        label: "The Title Track Hands the Last Word to Sabrina Carpenter",
        why: "The vault moment grounds the duet's narrative function: Sabrina is not just the feature, but the younger showgirl inside the song's passing-the-torch structure."
      }
    ],
    sources: [
      {
        name: "The Life of a Showgirl",
        url: "https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl"
      },
      {
        name: "Taylor Swift talks new album on New Heights podcast",
        url: "https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce"
      },
      {
        name: "Taylor Swift Unveils The Life of a Showgirl Cover, Sabrina Carpenter Feature",
        url: "https://www.rollingstone.com/music/music-news/taylor-swift-life-of-showgirl-details-cover-new-heights-1235406130/"
      }
    ]
  }
};
