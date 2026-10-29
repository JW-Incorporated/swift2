// Text-only rows that predate the media rule (P1-23), pinned by stable key
// AND content hash (first 16 hex of the row's sha256, momentFingerprint). The
// exemption is exact: editing a listed row changes its hash, voids the
// exemption, and the edit must add renderable media. Content-only changes
// cannot add entries here; remove an entry once its row gains media.
const SURFACE_MEDIA_LEGACY_TEXT = `
releases/releases.mjs#taylor-swift 544fd23192274b27
releases/releases.mjs#napster-live 30cbfc61123748ec
releases/releases.mjs#the-taylor-swift-holiday-collection fd167fdbd76e5e61
releases/releases.mjs#itunes-live-from-soho 90a9173c1106550a
releases/releases.mjs#beautiful-eyes 8e4d1853b934ce84
releases/releases.mjs#fearless 16cbde176e6406fb
releases/releases.mjs#fearless-platinum-edition d45bdfce77060943
releases/releases.mjs#speak-now fdb3cb0344fe13ee
releases/releases.mjs#speak-now-world-tour-live 3219f91cf15e68c1
releases/releases.mjs#red 4ec649065b8982db
releases/releases.mjs#1989 95cf542aeb783df1
releases/releases.mjs#reputation a254b18550c75e35
releases/releases.mjs#spotify-singles 48a5ce3fee760e5d
releases/releases.mjs#lover aed9e8945ae9c149
releases/releases.mjs#live-from-clear-channel-stripped-2008 d3d1cf509ac784a5
releases/releases.mjs#folklore fbae77d43e5947f8
releases/releases.mjs#folklore-the-long-pond-studio-sessions cb7a874f32c5f6f5
releases/releases.mjs#evermore d5937b6a93cb907a
releases/releases.mjs#fearless-taylors-version f9970cbe1d75573b
releases/releases.mjs#red-taylors-version fb6bdb8520d5ba6f
releases/releases.mjs#midnights 0d83cad5daca7e25
releases/releases.mjs#midnights-3am-edition 04a293a397ee640d
releases/releases.mjs#lover-live-from-paris 4de2956e459c6276
releases/releases.mjs#midnights-the-til-dawn-edition d7388ae7605f82d5
releases/releases.mjs#speak-now-taylors-version 531cd5049fd25618
releases/releases.mjs#1989-taylors-version a99aeed7adffaf31
releases/releases.mjs#the-tortured-poets-department d0a25ddf064fa893
releases/releases.mjs#ttpd-the-anthology 52bbfe787adfd1ce
releases/releases.mjs#the-life-of-a-showgirl 81b8018220d17f6a
tours/tours.mjs#fearless-tour 9991be8f92e7ed2d
tours/tours.mjs#speak-now-world-tour e3d156363f65f0b8
tours/tours.mjs#the-red-tour fbb7c5c2dbe649dc
tours/tours.mjs#the-1989-world-tour 9c561bbd78199077
tours/tours.mjs#reputation-stadium-tour ec75773242086f14
tours/tours.mjs#the-eras-tour 8f28631a23a2511a
theories/1989.mjs#no-its-becky 6f752ddb5eaaba25
theories/1989.mjs#1989-lowercase-liner-codes 1ee087eabea7bdea
theories/1989.mjs#1989-polaroid-cover 285a578ee8a421e7
theories/1989.mjs#1989-deluxe-voice-memos 415036ff5ca3fd50
theories/1989.mjs#blank-space-media-caricature 541c859df98486c1
theories/1989.mjs#blank-space-starbucks-lovers 252734dba543f480
theories/debut.mjs#lucky-number-13 ae2447c5dc1670d5
theories/debut.mjs#liner-notes-hidden-messages 61ae45d87862d0c9
theories/debut.mjs#tim-mcgraw-debut-single-nested-clue 88cfaa7a0339bf94
theories/debut.mjs#the-outside-first-song-outcast 83c2f7f096e053d0
theories/debut.mjs#a-place-in-this-world-mission-statement 2592e144f51d0a32
theories/evermore.mjs#thirteen-backwards 01f9232145b2888d
theories/evermore.mjs#dorothea-and-the-love-triangle 1eca5d22c8bef43c
theories/evermore.mjs#ivy-the-affair-narrative b0c563ea020d5555
theories/evermore.mjs#cowboy-like-me-two-con-artists a040e2c14810d25c
theories/evermore.mjs#closure-discomfort-by-design 4f291894cd35c038
theories/evermore.mjs#evermore-bonus-tracks-true-ending cce9159d48671668
theories/evermore.mjs#marjorie-grandmothers-vocals 8db74eb9824b7001
theories/fearless.mjs#the-best-day-liner-note-code 612e97e9505e1343
theories/fearless.mjs#vault-track-anagram-reveal 992bc624a20faf47
theories/fearless.mjs#the-best-day-surprise-home-video 7fb1d46cf16e72ff
theories/fearless.mjs#love-story-rewritten-ending 85c74c6326f5251e
theories/fearless.mjs#change-underdog-anthem bcb8829efa81aef8
theories/folklore.mjs#woodvale 1ba22354e0d46f0f
theories/folklore.mjs#teenage-love-triangle 83404080347ad4bb
theories/folklore.mjs#william-bowery d2affd415938a0c2
theories/lover.mjs#butterfly-mural e56231631714cc1d
theories/lover.mjs#mastermind-doctrine 947c59acb7ac1e2e
theories/lover.mjs#me-video-chicks-painting 7af6dcb47e46a6ba
theories/lover.mjs#the-man-karma-graffiti 22ec2e25114501cc
theories/lover.mjs#lover-house-eras-map 5a9623bbda540737
theories/midnights.mjs#karma-lost-album 9d56c27b12a09df7
theories/midnights.mjs#bejeweled-speak-now-clues 5e3fc4a7c3764d50
theories/midnights.mjs#vault-puzzles-1989 517506e01f34a82a
theories/midnights.mjs#eight-nine-sofi 593aaa1a808b11c7
theories/midnights.mjs#album-color-canon 99507df76b4f22b3
theories/midnights.mjs#surprise-song-metagame d00e082e441e05bb
theories/midnights.mjs#friendship-bracelets 6f82be656e3cd8ef
theories/red.mjs#twenty-two-liner-note-code 728f4bc1f2e58ac0
theories/red.mjs#vault-track-word-puzzle-reveal 243f2c09c7d687d1
theories/red.mjs#not-a-lot-going-on-shirt 15764c51b9c849ed
theories/red.mjs#i-bet-you-think-about-me-video-eggs 29dd8967dc5c5da5
theories/red.mjs#all-too-well-original-ten-minutes 1b875d7e31166621
theories/red.mjs#i-bet-you-think-about-me-rerecord-clues 35cbb710bef25819
theories/reputation.mjs#snake-reclamation e1ca1222aa648ab9
theories/reputation.mjs#lwymmd-nils-sjoberg-gravestone dfdaddf3ec1fd28d
theories/reputation.mjs#lwymmd-dollar-bill 66734b7e0a841f0c
theories/reputation.mjs#old-taylors-ending 384a67504a06582f
theories/reputation.mjs#lwymmd-et-tu-brute 1eca57699b24c421
theories/reputation.mjs#reputation-tabloid-cover 14067f2b9e573eec
theories/speak-now.mjs#never-grow-up-liner-note-code 530d5fb042df6912
theories/speak-now.mjs#speak-now-tv-tracklist-reveal 79d7329d97bff878
theories/speak-now.mjs#mine-leak-rush-release 4fcc8af3c43eaeb9
theories/speak-now.mjs#speak-now-tour-surprise-covers b8039cda2cd63148
theories/speak-now.mjs#speak-now-written-entirely-alone f22bebb7848d489a
theories/speak-now.mjs#long-live-band-and-fans-tribute b75eed3c801c91fd
theories/the-life-of-a-showgirl.mjs#orange-era-clues 87a09d25093f2e23
theories/the-life-of-a-showgirl.mjs#ophelia-rewrite cb612788a2d5e6f2
theories/the-life-of-a-showgirl.mjs#father-figure-george-michael-interpolation d21087f9ee89cec6
theories/the-life-of-a-showgirl.mjs#eldest-daughter-track-five 65e3a600a0ce8adf
theories/the-life-of-a-showgirl.mjs#ophelia-video-self-references 7729e2282d1398ef
theories/the-life-of-a-showgirl.mjs#ts12-twelfth-album-twelve-tracks f06ac5325f25b8ae
theories/the-life-of-a-showgirl.mjs#showgirl-spotify-canvas-color-swap 2da72adcbcc25748
theories/the-life-of-a-showgirl.mjs#gracie-abrams-death-wish-not-about-taylor 3f6a2c37e085ae3e
theories/the-life-of-a-showgirl.mjs#showgirl-esb-green-ts-debut-era 37e34a6ba395d862
theories/tortured-poets.mjs#thank-you-aimee-capitals 779b147c92e816a2
theories/tortured-poets.mjs#peter-pan-throughline 0ff81462c87b75fd
theories/tortured-poets.mjs#fortnight-dead-poets-casting 3bd8c8e2ac5cd859
theories/tortured-poets.mjs#ttpd-spotify-library-eggs adb27bf9179a8ed3
theories/tortured-poets.mjs#black-dog-real-pub 468dcf49a8e443c8
theories/tortured-poets.mjs#ttpd-grief-playlists 4db97da17877ca3c
theories/tortured-poets.mjs#clara-bow-it-girl-lineage 0d958555704790fd
theories/tortured-poets.mjs#cassandra-reputation-callback 74e91832594b72fe
theories/tortured-poets.mjs#ttpd-quill-fountain-pen-era 0c21845aa273b55d
videos/1989.mjs#the-1989-world-tour-live-film c47652979b2651c6
videos/fearless.mjs#journey-to-fearless e14395fd44335dfc
videos/lover.mjs#miss-americana 0f6f768d1d01f43b
videos/lover.mjs#city-of-lover 47929398c653a9cc
videos/midnights.mjs#taylor-swift-the-eras-tour-film 3e075322490d6c1a
videos/reputation.mjs#reputation-stadium-tour-film b03e1b4bfc606059
videos/speak-now.mjs#speak-now-world-tour-live e46ceaba1803e11c
videos/the-life-of-a-showgirl.mjs#the-official-release-party-of-a-showgirl 04979498ee397995
merch/official.mjs#8238952612040 145ec43ede43b59d
merch/official.mjs#8239061434568 701d90df3c87b2a4
`;

export const SURFACE_MEDIA_LEGACY = new Map(
  SURFACE_MEDIA_LEGACY_TEXT.trim()
    .split('\n')
    .map((line) => line.split(' ')),
);
