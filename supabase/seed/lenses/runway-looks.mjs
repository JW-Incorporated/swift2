// Sourcing note: RunwayLook has no `sources` field yet (schema change
// landing separately) — grounding is in `// Source:` comments per entry
// until that field exists. Descriptions below cite one specific, real,
// verifiable occasion/detail per era rather than a generic mood/vibe line.
export const RUNWAY_LOOKS = [
  {
    id: 'look-debut',
    eraId: 'debut',
    name: 'Curls & Cowboy Boots',
    // Source: widely documented in early press/CMT/Opry appearances,
    // 2006-2008 — sundresses, natural curls, and cowboy boots as the
    // consistent early public style, e.g. her 2006 Grand Ole Opry debut.
    // Consolidated here (issue #722, 2026-08-24): the era's single-source
    // award-show gowns (BCBG at the 2007 CMTs, Sandi Spika at the 2007 ACMs
    // and 2008 Grammys, Badgley Mischka at her 2008 Met Gala debut, Elvira at
    // the 2006 CMAs, Catherine Malandrino at the 2007 AMAs) were each a
    // single red-carpet card diluting the timeline — routed here as the
    // era's formal-gown counterpoint to the everyday look, rather than
    // seven near-duplicate moments. The gowns themselves now have their own
    // dedicated gallery card below (issue #722 walk-15's "destination half":
    // a real second look per era, not just a description-line mention).
    description: 'Sundresses, natural ringlet curls, and cowboy boots — the everyday uniform across her earliest public appearances, 2006-2008.',
    images: [
      { url: 'https://media.gettyimages.com/id/72424326/photo/nashville-tn-singer-taylor-swift-attends-the-40th-annual-cma-awards-at-the-gaylord.jpg?s=612x612&w=0&k=20&c=FMqoljbEnk8vDoj9GV31oa5bc-XfMFv5IBBru2GpOOU=', credit: 'Peter Kramer/Getty Images', caption: 'The 2006 CMA Awards — her first CMA red carpet, two weeks after her debut album released.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/74685453/photo/taylor-swift-accepts-breathrough-video-of-the-year-award-for-tim-mcgraw-at-the-the-curb-event.jpg?s=612x612&w=0&k=20&c=OXeqcfP0Cw1pyRw7pyQvqnnVwE6Tz-7uB4gLLHhUbDU=', credit: 'Kevin Mazur/WireImage', caption: 'Accepting the Breakthrough Video of the Year award for "Tim McGraw," 2007 CMT Music Awards.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/77768817/photo/nashville-tn-singer-taylor-swift-arrives-at-the-41st-annual-cma-awards-at-the-sommet-center-on.jpg?s=612x612&w=0&k=20&c=DHSYR2P-690lCn_YY6YDBibMaj2eXClOHL02I1xLbQE=', credit: 'Bryan Bedder/Getty Images', caption: 'The 2007 CMA Awards, the night she won the Horizon Award for Best New Artist.', kind: 'primary' },
    ],
    shopTags: ['Cowboy boots', 'Sundress', 'Acoustic guitar'],
  },
  {
    // Second look per era (issue #722 walk-15, 2026-08-25): the gowns PR
    // #3226 routed off the debut timeline, now built out as their own
    // gallery instead of a bullet-point list in the look above. Photos and
    // captions are the same real, already-fact-checked ones that ran on the
    // removed timeline cards (git show f4f89e9c:supabase/seed/content/
    // debut.mjs) — reused because they were sourced and curl-verified once
    // already; re-verified live here via image-liveness.mjs's probe() on
    // 2026-08-25 (all three returned HTTP 200/206 image/jpeg).
    id: 'look-debut-red-carpet',
    eraId: 'debut',
    name: 'Award Season Gowns',
    // Source: each gown/date/event below is the same fact set the removed
    // debut.mjs timeline cards carried (Nylon, E! Online, Who What Wear,
    // Hello! — see the pre-#3226 file for full citations).
    description: 'Three formal counterpoints to the everyday sundress-and-boots look: a black satin Elvira mermaid gown at her first CMA Awards in 2006, a purple corseted Sandi Spika gown at her 2008 Grammys debut, and a gold sequined Badgley Mischka gown for her first Met Gala the same year — each a single red-carpet turn from the era\'s earliest and biggest nights.',
    images: [
      { url: 'https://imgix.bustle.com/uploads/getty/2021/3/12/ade21f91-a42e-495b-94bb-7aa27d3475f7-getty-106036150.jpg?w=653&h=1032&fit=crop&crop=faces', credit: 'Stephen Lovekin/WireImage/Getty Images', caption: 'The 40th CMA Awards, Nov. 6, 2006 — a black satin Elvira mermaid gown with matching long gloves, weeks after her debut album released.', kind: 'primary', focalPoint: '47% 13%' },
      { url: 'https://cdn.mos.cms.futurecdn.net/pcCpw2aDF3RYNof57biCSP.jpg', credit: 'Getty Images', caption: 'The 50th Grammy Awards, Feb. 10, 2008 — her red carpet debut at music\'s biggest night, in a strapless corseted purple Sandi Spika gown.', kind: 'primary', focalPoint: '53% 11%' },
      { url: 'https://static.gofugyourself.com/uploads/2016/04/80995253-taylor-swift-met-ball-2008-510x736.jpg', credit: 'Getty Images', caption: 'Her first Met Gala, May 5, 2008 — a gold sequined Badgley Mischka gown for that year\'s "Superheroes: Fashion and Fantasy" theme.', kind: 'primary' },
    ],
    shopTags: ['Elvira gown', 'Sandi Spika gown', 'Badgley Mischka gown'],
  },
  {
    id: 'look-fearless',
    eraId: 'fearless',
    name: 'Golden Fairy Tale',
    // Source: the Fearless-era stage costuming (2008-2010 Fearless Tour)
    // was built around gold sequins and fringe, widely documented in tour
    // photography and the Fearless Tour DVD/CD release.
    // Consolidated here (issue #722, 2026-08-24): 11 single-event red-carpet
    // gown cards were diluting the timeline — including a 3-card cluster all
    // dated Jan. 31, 2010 (the Grammys) — routed here rather than re-told as
    // near-duplicate moments. The gold Reem Acra CMA gown and the Grammy-night
    // gowns are the same red-carpet run these photos already show; the era's
    // milestone moments (the CMA sweep, the Grammy AOTY win) keep their own
    // dedicated timeline cards. Those gowns now have their own dedicated
    // gallery card below (issue #722 walk-15's "destination half").
    description: 'Gold sequined dresses with fringe hems, built for the 2009-2010 Fearless Tour stage — shimmer as the era\'s visual signature.',
    images: [
      { url: 'https://media.gettyimages.com/id/90123128/photo/new-york-musician-taylor-swift-performs-during-the-fearless-tour-at-madison-square-garden-on.jpg?s=612x612&w=0&k=20&c=YHmf-SDSDaqBJE0v3LoyXCOEAfp5H7LAFhEFUaU6w2Q=', credit: 'Jason Kempin/Getty Images', caption: 'Onstage at Madison Square Garden on the Fearless Tour, August 2009 — the gold sequin-and-fringe stage costuming.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/92993789/photo/nashville-tn-musician-taylor-swift-attends-the-43rd-annual-cma-awards-at-the-sommet-center-on.jpg?s=612x612&w=0&k=20&c=KIGRyZPxBgSgnbtm12oyKoTLquqmZxGh8av7sZmCKio=', credit: 'Frederick Breedon/Getty Images', caption: '43rd Annual CMA Awards, November 2009, the night she won Entertainer of the Year.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/96320463/photo/los-angeles-ca-taylor-swift-accepts-award-at-the-52nd-annual-grammy-awards-held-at-staples.jpg?s=612x612&w=0&k=20&c=OYR0-P-tyCyeRV1MIuieQDkUbXUiw5f_u9Y_uGnC0PU=', credit: 'Kevin Mazur/WireImage', caption: 'The 52nd Grammys, January 2010 — the ceremony where Fearless won Album of the Year.', kind: 'primary' },
    ],
    shopTags: ['Gold sequins', 'Fringe dress'],
  },
  {
    // Second look per era (issue #722 walk-15, 2026-08-25): same rationale
    // as look-debut-red-carpet above — real photos reused from the removed
    // fearless.mjs timeline cards (git show f4f89e9c:supabase/seed/content/
    // fearless.mjs), re-verified live via probe() on 2026-08-25.
    id: 'look-fearless-red-carpet',
    eraId: 'fearless',
    name: 'The Sweep-Season Gowns',
    // Source: E! Online's CMA style retrospective, Femestella's Grammy
    // retrospective — same facts the removed fearless.mjs cards carried.
    description: 'Three gowns from Fearless\'s awards sweep: the gold Reem Acra she wore the night she took all four of her 2009 CMA nominations, the mauve Dolce & Gabbana cocktail dress from the 2010 Grammy pre-telecast ceremony where "White Horse" picked up her first two Grammy wins, and the navy KaufmanFranco off-the-shoulder sequin gown from that evening\'s main telecast, where Fearless won Album of the Year.',
    images: [
      { url: 'https://media.gettyimages.com/id/93005940/photo/the-43rd-annual-cma-awards-arrivals.jpg?s=594x594&w=0&k=20&c=vSzO7akNN5nM5rgvS8oYRyyvApcm0uCienxGRp9sFYI=', credit: 'Taylor Hill/WireImage, via Getty Images', caption: 'The gold Reem Acra gown on the Nov. 11, 2009 CMA Awards red carpet, the night she swept all four of her nominations.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/96303852/photo/the-52nd-annual-grammy-awards-pre-telecast-show.jpg?s=594x594&w=0&k=20&c=m6WSv7vy-GdYcvplS6Q2QZh-kSvnl2vE1PtlTEmQjvw=', credit: 'Kevin Winter/Getty Images', caption: 'A mauve Dolce & Gabbana cocktail dress at the Jan. 31, 2010 Grammy pre-telecast ceremony, accepting Best Country Song for "White Horse."', kind: 'primary', focalPoint: '49% 14%' },
      { url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2023/02/Depositphotos_15014271_XL.jpg?resize=800%2C1204&ssl=1', credit: 'Depositphotos, via Femestella', caption: 'A navy off-the-shoulder KaufmanFranco sequin gown at the same day\'s Grammy telecast, the night Fearless won Album of the Year.', kind: 'primary', focalPoint: '51% 12%' },
    ],
    shopTags: ['Reem Acra gown', 'Dolce & Gabbana dress', 'KaufmanFranco gown'],
  },
  {
    id: 'look-speak-now',
    eraId: 'speak-now',
    name: 'Theatrical Ballgown',
    // Source: the Speak Now Tour (2011-2012) staged each song with a
    // costume change built around sweeping ballgowns, most iconically the
    // purple gown for the title track — widely documented in tour
    // photography and the Speak Now World Tour Live DVD.
    // Consolidated here (issue #722, 2026-08-24): a 5-card tour-costume
    // cluster (Roberto Cavalli, Susan Hilferty x2, Alice + Olivia, Theia),
    // all dated Feb. 9, 2011 and single-sourced to the same Femestella
    // retrospective, plus a run of single-event red-carpet gowns (Monique
    // Lhuillier, J. Mendel, Elie Saab, Zuhair Murad) were diluting the
    // timeline with near-duplicate cards — routed here rather than re-told
    // one dress at a time. The album-cover Reem Acra gown and its 2nd-CMA/
    // 2nd-AMA milestone siblings keep their own dedicated timeline cards.
    // Those red-carpet gowns now have their own dedicated gallery card below
    // (issue #722 walk-15's "destination half").
    description: 'Sweeping ballgowns built for a costume change per song on the 2011-2012 Speak Now World Tour — the purple title-track gown is the era\'s signature image.',
    images: [
      { url: 'https://media.gettyimages.com/id/133959142/photo/new-york-ny-taylor-swift-performs-onstage-during-the-speak-now-world-tour-at-madison-square.jpg?s=612x612&w=0&k=20&c=y1hMgJsHy019MpfDstyKuu9CzPYiJrhr-iiQITHWayM=', credit: 'Larry Busacca/Getty Images', caption: 'Closing the North American leg of the Speak Now World Tour at Madison Square Garden, November 2011.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/132337181/photo/the-45th-annual-cma-awards-red-carpet-arrivals-the-45th-annual-cma-awards-will-broadcast-live.jpg?s=612x612&w=0&k=20&c=euc9GyAZp1drmxPNmIEsGN2zWDBbxI37d1ciMgNoDKc=', credit: 'Jason Kempin/Disney General Entertainment Content via Getty Images', caption: '45th Annual CMA Awards red carpet, November 2011, Bridgestone Arena.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/119786566/photo/newark-nj-taylor-swift-performs-during-her-speak-now-tour-at-prudential-center-on-july-24-2011.jpg?s=612x612&w=0&k=20&c=k5Su-esMu6vC15bz_cmTkhZ_wHl0ur3FCzvg5TLO4CQ=', credit: 'Kevin Mazur/WireImage', caption: 'Performing at Prudential Center, Newark, on the Speak Now Tour, July 2011.', kind: 'primary' },
    ],
    shopTags: ['Ballgown', 'Purple velvet', 'Roberto Cavalli fringe'],
  },
  {
    // Second look per era (issue #722 walk-15, 2026-08-25): same rationale
    // as look-debut-red-carpet above — real photos reused from the removed
    // speak-now.mjs timeline cards (git show f4f89e9c:supabase/seed/content/
    // speak-now.mjs), re-verified live via probe() on 2026-08-25.
    id: 'look-speak-now-red-carpet',
    eraId: 'speak-now',
    name: 'Album-Era Red Carpet',
    // Source: Yahoo/Insider's CMA style retrospective, Femestella's
    // Speak-Now-era retrospective, Taste of Country — same facts the removed
    // speak-now.mjs cards carried.
    description: 'A run of red-carpet gowns from the Speak Now rollout: a strapless red Monique Lhuillier gown at the 2010 CMA Awards the same month the album topped the charts, a beaded gold Zuhair Murad minidress at the 2011 Vanity Fair Oscar Party — a designer relationship she\'d return to a year later in Zuhair Murad Couture at the Grammys — and a strapless pink Elie Saab sequin gown at the 2011 Billboard Music Awards, the night she won Country Artist of the Year.',
    images: [
      { url: 'https://media.zenfs.com/en/insider_articles_922/a5afcd15ea4573043b3e2718c01fa859', credit: 'Larry Busacca/Getty Images', caption: 'A strapless red Monique Lhuillier gown at the Nov. 10, 2010 CMA Awards, the same month Speak Now topped the charts.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/109489184/photo/west-hollywood-ca-singer-taylor-swift-arrives-at-the-vanity-fair-oscar-party-at-sunset-tower.jpg?s=612x612&w=0&k=20&c=LYkicour3elj3xJhOZJvSJRNzd6pLXo7qpJM_9WWRM8=', credit: 'Jon Kopaloff/Getty Images', caption: 'A beaded gold Zuhair Murad minidress at the Feb. 27, 2011 Vanity Fair Oscar Party, Sunset Tower.', kind: 'primary' },
      { url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_12995401_XL.jpg', credit: 'Depositphotos, via Femestella', caption: 'A strapless pink Elie Saab sequin gown at the May 22, 2011 Billboard Music Awards, the night she won Country Artist of the Year.', kind: 'primary' },
    ],
    shopTags: ['Monique Lhuillier gown', 'Zuhair Murad minidress', 'Elie Saab gown'],
  },
  {
    id: 'look-red',
    eraId: 'red',
    name: 'Red Lip Classic',
    // Source: Swift has spoken on record about adopting a red lip as a
    // deliberate signature during the Red era (2012-2013) alongside
    // vintage-inspired tailoring and knitwear.
    description: 'A bold red lip as a deliberate signature (Swift has discussed this choice on record), paired with vintage-cut tailoring and autumn knitwear.',
    images: [
      { url: 'https://media.gettyimages.com/id/155121144/photo/nashville-tn-taylor-swift-performs-during-the-46th-annual-cma-awards-at-the-bridgestone-arena.jpg?s=612x612&w=0&k=20&c=_eRjHqsT9GNe4uw9JAAcjwnr5wfnwDQFZkgxMhWDKkQ=', credit: 'Jason Kempin/Getty Images', caption: 'Performing at the 46th CMA Awards, November 2012, just after Red released — red lip and vintage-cut tailoring.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/161394336/photo/los-angeles-ca-taylor-swift-arrives-at-the-55th-annual-grammy-awards-on-february-10-2013-in.jpg?s=612x612&w=0&k=20&c=nAxTPznrcJLJtU5GP1Wndy-vJYC5lIAWbbhUPRohKx8=', credit: 'Christopher Polk/Getty Images for NARAS', caption: '55th Grammy Awards red carpet, February 2013 — the bold-red-lip, structured-glamour signature look.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/168069917/photo/detroit-mi-taylor-swift-swift-played-the-first-of-13-north-american-stadium-dates-on-the-red.jpg?s=612x612&w=0&k=20&c=MLwDmjrMhFEzEDreloQIwSkojuZjE1GeZjlDKID7JyM=', credit: 'Christopher Polk/TAS/Getty Images for TAS', caption: 'Opening night of the RED Tour\'s North American stadium run, Ford Field, Detroit, May 2013.', kind: 'primary' },
    ],
    shopTags: ['Red lipstick', 'Knit scarf', 'High-waist shorts'],
  },
  {
    id: 'look-1989',
    eraId: '1989',
    name: 'Polaroid Pop',
    // Source: the 1989 album cover/packaging (2014) was shot on Polaroid
    // film by photography duo Lowfield (Sarah Barlow & Stephen Schofield)
    // — 65 Polaroids taken, 13 included per physical copy — and the era's
    // press-tour style leaned into cropped separates and pastel minimalism.
    // The cover shoot is widely credited with reviving instant-film
    // cameras' popularity.
    description: 'Cropped separates and pastel minimalism for the press tour, echoing the Polaroid-shot 1989 album cover (photographed by Lowfield) that helped revive instant-camera culture in 2014.',
    images: [
      { url: 'https://media.gettyimages.com/id/499012186/photo/sydney-australia-taylor-swift-performs-during-her-1989-world-tour-at-anz-stadium-on-november.jpg?s=612x612&w=0&k=20&c=JZtyafJP6uAUFpBE_Wx2omw9vqifSKHPy3U2mZ_rbLU=', credit: 'Mark Metcalfe/Getty Images', caption: 'Performing at ANZ Stadium, Sydney, on the 1989 World Tour, November 2015 — cropped separates and pastel-pop stagewear.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/463018170/photo/los-angeles-ca-singer-taylor-swift-attends-the-57th-annual-grammy-awards-at-the-staples-center.jpg?s=612x612&w=0&k=20&c=G7tt3sh1t8OjpZ3PE-VVI2bhLkr3_FyipXKqtKzeKOw=', credit: 'Jason Merritt/Getty Images', caption: '57th Grammy Awards, February 2015 — sleek minimalism during the 1989 press cycle.', kind: 'primary' },
    ],
    shopTags: ['Crop set', 'Pastel blue', 'Instant camera'],
  },
  {
    id: 'look-reputation',
    eraId: 'reputation',
    name: 'Armored Monochrome',
    // Source: the reputation Stadium Tour (2018) snake-motif bodysuit was
    // designed by Fausto Puglisi for Roberto Cavalli; the "Look What You
    // Made Me Do" video (2017) used a related Philipp Plein bodysuit —
    // both widely credited in fashion press coverage.
    description: 'A black snake-motif bodysuit designed by Fausto Puglisi for Roberto Cavalli, built for the 2018 reputation Stadium Tour — armored, high-contrast, and defiant by design.',
    images: [
      { url: 'https://media.gettyimages.com/id/873082902/photo/saturday-night-live-episode-1730-pictured-musical-guest-taylor-swift-performs-ready-for-it-in.jpg?s=612x612&w=0&k=20&c=I0_V3toxsKgmdYFDEnyjBjSWIQfGpHp2abI0qvTLIgA=', credit: 'Will Heath/NBCU Photo Bank/NBCUniversal via Getty Images', caption: 'Saturday Night Live, November 2017 — the first major performance launching the dark, armored aesthetic.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1003511368/photo/east-rutherford-nj-taylor-swift-swift-performs-onstage-during-the-taylor-swift-reputation.jpg?s=612x612&w=0&k=20&c=SvMDUJCj_VP457sTHsu4ccsB-Pm7ZEOuEFvp7RnQnS4=', credit: 'Kevin Mazur/TAS18/Getty Images for TAS', caption: 'reputation Stadium Tour, MetLife Stadium, July 2018 — the Fausto Puglisi-for-Roberto Cavalli snake bodysuit.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/961777280/photo/billboard-music-awards-red-carpet-arrivals-2018-bbmas-at-the-mgm-grand-las-vegas-nevada.jpg?s=612x612&w=0&k=20&c=Ma4s1at0Recz800B1mzcLzHjZy3jAXC7FZAyluncfnk=', credit: 'Getty Images', caption: '2018 Billboard Music Awards red carpet — structured eveningwear off-stage.', kind: 'primary' },
    ],
    shopTags: ['Black bodysuit', 'Combat boots'],
  },
  {
    id: 'look-lover',
    eraId: 'lover',
    name: 'Pastel Dreamscape',
    // Source: the Lover album era (2019) press cycle and "ME!"/"You Need
    // To Calm Down" videos leaned into pastel, glitter, and rainbow
    // styling — widely documented in music-video credits and press
    // photography from the era.
    description: 'Glitter, pastel ombré, and rainbow motifs across the "ME!" and "You Need To Calm Down" video eras (2019) — the most maximalist-colorful era in the catalog.',
    images: [
      { url: 'https://media.gettyimages.com/id/1170400152/photo/newark-new-jersey-taylor-swift-performs-onstage-during-the-2019-mtv-video-music-awards-at.jpg?s=612x612&w=0&k=20&c=TKdJq3vfNNEq9Toonzypr0yHYsx1sbdhXfLdGq7OFl0=', credit: 'Dimitrios Kambouris/Getty Images for MTV', caption: '2019 MTV VMAs opening performance, Prudential Center, August 2019 — pastel-and-glitter maximalism.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1164293743/photo/us-singer-songwriter-taylor-swift-performs-on-stage-during-2019-mtv-video-music-awards-at-the.jpg?s=612x612&w=0&k=20&c=wB8bBzCahzYMIo_ia3MDAtVjZtMFUaXNURlvBlidO1M=', credit: 'Angela Weiss/AFP via Getty Images', caption: 'The same VMAs night — the rainbow-and-sequin motif from the "ME!"/"You Need To Calm Down" video era.', kind: 'primary' },
    ],
    shopTags: ['Sequin blazer', 'Pastel ombré'],
  },
  {
    id: 'look-folklore',
    eraId: 'folklore',
    name: 'Cottagecore Cardigan',
    // Source: the "cardigan" music video (2020) featured a cream
    // cable-knit cardigan with star embroidery that Swift's own store sold
    // as official merchandise; the folklore era is widely credited with
    // driving a cottagecore aesthetic revival, including a documented
    // surge in hand-knitted sweater sales.
    description: 'A cream cable-knit cardigan with embroidered stars, worn in the 2020 "cardigan" video and sold as official merch — the era credited with sparking cottagecore\'s mainstream revival.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307122077/photo/los-angeles-california-taylor-swift-winner-of-the-album-of-the-year-award-for-folklore.jpg?s=612x612&w=0&k=20&c=8Z1VYOY-Yc9qqWC8LYlHMDBpJd03w6R2p_QKc_ZkSWY=', credit: 'Kevin Mazur/Getty Images for The Recording Academy', caption: '63rd Grammys media room, March 2021, the night folklore won Album of the Year — soft, muted press-room styling.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1230196449/photo/jimmy-kimmel-live-jimmy-kimmel-live-airs-every-weeknight-at-11-35-p-m-est-and-features-a.jpg?s=612x612&w=0&k=20&c=4xSmOy8X1s88VPpsUQ5tCpVmrgHW7ZTDivXXyN2u984=', credit: 'Randy Holmes/ABC via Getty Images', caption: 'Promoting Disney+\'s Folklore: The Long Pond Studio Sessions, December 2020 — the cottagecore-cardigan press cycle.', kind: 'primary' },
    ],
    shopTags: ['Cardigan', 'Prairie dress'],
  },
  {
    id: 'look-evermore',
    eraId: 'evermore',
    name: 'Autumn Flannel',
    // Source: evermore (2020) was explicitly framed by Swift as folklore's
    // "sister record," and its era styling followed suit with rustic
    // autumnal tones — documented in the album's own visual rollout.
    description: 'Rust plaid and autumnal tones, following folklore\'s cottagecore direction — Swift herself called evermore folklore\'s "sister record" on release.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307107698/photo/los-angeles-california-in-this-image-released-on-march-14-taylor-swift-performs-onstage-for.jpg?s=612x612&w=0&k=20&c=tSXS2cDZuIiO6hOsdBlz5ClyTS44kuywHGxtvubYD64=', credit: 'TAS Rights Management 2021, via Getty Images', caption: '63rd Grammys broadcast performance, March 2021 — the rustic-autumnal costume for the "willow"/"august"/"cardigan" medley.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2163401668/photo/london-england-an-outfit-worn-by-taylor-swift-in-the-willow-music-video-on-display-at-the.jpg?s=612x612&w=0&k=20&c=CNcGuN7SAhF9FTpFsILiccqbV4-UhUZLNb37xxFg_Jc=', credit: 'Gareth Cattermole/Getty Images', caption: 'The actual Zimmermann costume worn in the 2020 "willow" video, on display at the V&A\'s Taylor Swift Songbook Trail, 2024.', kind: 'primary' },
    ],
    shopTags: ['Flannel', 'Braided hair'],
  },
  {
    id: 'look-midnights',
    eraId: 'midnights',
    name: 'Midnight Glam',
    // Source: the "Bejeweled" video (2022) and Midnights press cycle used
    // deep-blue, retro-glam sequined styling — widely documented in the
    // video's own credits and press coverage.
    description: 'Deep-blue, retro-glam sequins from the 2022 "Bejeweled" video and Midnights press cycle — late-night jeweled styling built around the album\'s after-hours concept.',
    images: [
      { url: 'https://media.gettyimages.com/id/1418923160/photo/newark-new-jersey-taylor-swift-accepts-the-video-of-the-year-award-for-all-too-well-onstage.jpg?s=612x612&w=0&k=20&c=E6UsqO3HGj62L9IfUKzTKWIJFiO21z9WHl8583qqKgc=', credit: 'Kevin Mazur/Getty Images for MTV/Paramount Global', caption: '2022 MTV VMAs, August 2022 — the black gown she wore when she announced Midnights minutes later.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1801109903/photo/sao-paulo-brazil-taylor-swift-performs-onstage-during-taylor-swift-the-eras-tour-at-allianz.jpg?s=612x612&w=0&k=20&c=cckANjdYrCz8rTv_ePOsBTNJSjjEryBkG4SZf7mbSwg=', credit: 'Buda Mendes/TAS23/Getty Images for TAS Rights Management', caption: 'The Eras Tour\'s Midnights segment, Sao Paulo, November 2023 — the sparkling blue bodysuit built for the set.', kind: 'primary' },
    ],
    shopTags: ['Sequin jumpsuit', 'Jewel tones'],
  },
  {
    id: 'look-ttpd',
    eraId: 'ttpd',
    name: 'Ink & Monochrome',
    // Source: The Tortured Poets Department (2024) rollout and Eras Tour
    // set addition used black-and-white, literary-coded styling —
    // documented in the album's own visual campaign and tour costuming.
    description: 'Black-and-white, sheer-layered styling for the 2024 Tortured Poets Department rollout and its Eras Tour set — literary austerity as the era\'s visual language.',
    images: [
      { url: 'https://media.gettyimages.com/id/1986749514/photo/los-angeles-california-taylor-swift-accepts-the-album-of-the-year-award-for-midnights-during.jpg?s=612x612&w=0&k=20&c=cd2UuP1Rc0TscH2iOlfpaleSHExede-2EvAlQLgEIcY=', credit: 'John Shearer/Getty Images for The Recording Academy', caption: '66th Grammys, February 2024 — the same speech in which she announced The Tortured Poets Department.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2171433177/photo/elmont-new-york-taylor-swift-accepts-the-the-video-of-the-year-award-for-fortnight-on-stage.jpg?s=612x612&w=0&k=20&c=AhJY-K0dfJtC0fOMvCbeqMMMmegetx3-cyeCsKx9kiw=', credit: 'Noam Galai/Getty Images for MTV', caption: '2024 MTV VMAs, September 2024 — accepting Video of the Year for "Fortnight," the black-and-white typewriter aesthetic.', kind: 'primary' },
    ],
    shopTags: ['White dress', 'Black tailoring'],
  },
  {
    id: 'look-tloas',
    eraId: 'tloas',
    name: 'Bathtub Showgirl',
    description: 'Portofino-orange sequins, rhinestone bras, and Bob Mackie-inspired feathers — a Vegas showgirl’s victory lap.',
    images: [
      { url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png', credit: 'Mert Alas & Marcus Piggott / Republic Records, via Wikipedia', caption: 'The Life of a Showgirl album cover, October 2025 — restaging Millais\'s Ophelia beneath the orange-glitter title.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2239236278/photo/the-tonight-show-starring-jimmy-fallon-episode-2195-pictured-singer-songwriter-taylor-swift.jpg?s=612x612&w=0&k=20&c=dOxOXlE5sjOvB8Ynyh64KVBhylu4nKs0sXjlNFgDjjI=', credit: 'Todd Owyoung/NBC via Getty Images', caption: 'The Tonight Show Starring Jimmy Fallon, October 2025 — three days after Showgirl\'s release.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2239450762/photo/late-night-with-seth-meyers-episode-1713-pictured-singer-taylor-swift-during-an-interview.jpg?s=612x612&w=0&k=20&c=P7WGBkVpsIdHMdBALdvVxnpM29UTRCj3nofWKqXc2SY=', credit: 'Lloyd Bishop/NBC via Getty Images', caption: 'Late Night with Seth Meyers, October 2025 — another stop on the same TV-first Showgirl press run.', kind: 'primary' },
    ],
    shopTags: ['Orange sequins', 'Rhinestone bra', 'Feather headpiece'],
  },
];
