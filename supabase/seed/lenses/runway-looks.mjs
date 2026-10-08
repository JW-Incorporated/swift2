// Seed data for the LongLive Lens datasets — RUNWAY_LOOKS.
// Extracted from the pre-split packages/experience/src/lenses.ts monolith
// (R12 redo against the OS-021 packages/experience/src layout). Authored/
// reviewed content — this file, not lenses.generated.ts, is what content PRs
// review and merge.
//
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
    description: 'The formal counterpoint to the sundress-and-boots look began at her first CMA Awards in 2006, where she wore a black floor-length Elvira gown with black gloves. At her first Grammys in 2008 she wore a pale purple strapless Sandi Spika gown, and that May she made her Met Gala debut in a gold sequined Badgley Mischka gown from the label\'s fall 2008 collection, chosen for the "Superheroes: Fashion and Fantasy" theme.',
    images: [
      { url: 'https://imgix.bustle.com/uploads/getty/2021/3/12/ade21f91-a42e-495b-94bb-7aa27d3475f7-getty-106036150.jpg?w=653&h=1032&fit=crop&crop=faces', credit: 'Stephen Lovekin/WireImage/Getty Images', caption: 'The 40th CMA Awards, Nov. 6, 2006 — a black satin Elvira mermaid gown with matching long gloves, weeks after her debut album released.', kind: 'primary', focalPoint: '47% 13%' },
      { url: 'https://cdn.mos.cms.futurecdn.net/pcCpw2aDF3RYNof57biCSP.jpg', credit: 'Getty Images', caption: 'The 50th Grammy Awards, Feb. 10, 2008 — her red carpet debut at music\'s biggest night, in a strapless corseted purple Sandi Spika gown.', kind: 'primary', focalPoint: '53% 11%' },
      { url: 'https://static.gofugyourself.com/uploads/2016/04/80995253-taylor-swift-met-ball-2008-510x736.jpg', credit: 'Getty Images', caption: 'Her first Met Gala, May 5, 2008 — a gold sequined Badgley Mischka gown for that year\'s "Superheroes: Fashion and Fantasy" theme.', kind: 'primary' },
    ],
    shopTags: ['Elvira gown', 'Sandi Spika gown', 'Badgley Mischka gown'],
    sources: [
      { title: 'E! Online: Taylor Swift\'s Evolving CMA Awards Style Over the Years', url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years' },
      { title: 'Vanity Fair: All of Taylor Swift\'s Grammys Red-Carpet Looks Through the Years', url: 'https://www.vanityfair.com/style/photos/taylor-swift-grammys-red-carpet-looks' },
      { title: 'WWD: All of Taylor Swift\'s Met Gala Dresses: Romantic Ralph Lauren Ruffles, Edgy Silver Snakeskin Minidress and More', url: 'https://wwd.com/pop-culture/celebrity-news/feature/taylor-swift-met-gala-looks-1236346976/' },
    ],
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
    description: 'Three gowns from Fearless\'s awards run: a gold floor-skimming Reem Acra gown at the 2009 CMA Awards, a Dolce & Gabbana dress when she accepted a Grammy for "White Horse" at the pre-telecast ceremony on Jan. 31, 2010, and a sparkly blue KaufmanFranco gown for that evening\'s telecast. Harper\'s Bazaar counts Album of the Year for Fearless among her Grammy haul that night.',
    images: [
      { url: 'https://media.gettyimages.com/id/93005940/photo/the-43rd-annual-cma-awards-arrivals.jpg?s=594x594&w=0&k=20&c=vSzO7akNN5nM5rgvS8oYRyyvApcm0uCienxGRp9sFYI=', credit: 'Taylor Hill/WireImage, via Getty Images', caption: 'The gold Reem Acra gown on the Nov. 11, 2009 CMA Awards red carpet.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/96303852/photo/the-52nd-annual-grammy-awards-pre-telecast-show.jpg?s=594x594&w=0&k=20&c=m6WSv7vy-GdYcvplS6Q2QZh-kSvnl2vE1PtlTEmQjvw=', credit: 'Kevin Winter/Getty Images', caption: 'A Dolce & Gabbana cocktail dress at the Jan. 31, 2010 Grammy pre-telecast ceremony, accepting a Grammy for "White Horse."', kind: 'primary', focalPoint: '49% 14%' },
      { url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2023/02/Depositphotos_15014271_XL.jpg?resize=800%2C1204&ssl=1', credit: 'Depositphotos, via Femestella', caption: 'A navy off-the-shoulder KaufmanFranco sequin gown at the same day\'s Grammy telecast, the night Fearless won Album of the Year.', kind: 'primary', focalPoint: '51% 12%' },
    ],
    shopTags: ['Reem Acra gown', 'Dolce & Gabbana dress', 'KaufmanFranco gown'],
    sources: [
      { title: 'E! Online: Taylor Swift\'s Evolving CMA Awards Style Over the Years', url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years' },
      { title: 'Harper\'s Bazaar: Taylor Swift\'s Style Evolution Through the Years', url: 'https://www.harpersbazaar.com/celebrity/red-carpet-dresses/g71309753/taylor-swift-complete-style-fashion-evolution/' },
      { title: 'Who What Wear: Taylor Swift\'s Grammys Fashion Evolution, Explained by a Fashion Editor', url: 'https://www.whowhatwear.com/fashion/celebrity-style/taylor-swift-grammys-red-carpet-fashion-retrospective' },
    ],
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
    // A look is defined by its photos (#5353 ruling, #5355): each caption
    // describes its own image and the description names only what a photo
    // shows. Verified by viewing every photo on 2026-10-08.
    description: 'The Red era mixed retro sweetness with rock-show brights: she performed at the November 2012 CMA Awards seated in a red polka-dot, 1950s-style dress. At the February 2013 Grammys she walked the red carpet in a white pleated J. Mendel gown (Who What Wear), while on the Red Tour she played in a black-and-white striped top and red pants.',
    images: [
      { url: 'https://media.gettyimages.com/id/155121144/photo/nashville-tn-taylor-swift-performs-during-the-46th-annual-cma-awards-at-the-bridgestone-arena.jpg?s=612x612&w=0&k=20&c=_eRjHqsT9GNe4uw9JAAcjwnr5wfnwDQFZkgxMhWDKkQ=', credit: 'Jason Kempin/Getty Images', caption: 'Performing seated at the 46th CMA Awards, November 2012, just after Red released — a red polka-dot, 1950s-style dress.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/161394336/photo/los-angeles-ca-taylor-swift-arrives-at-the-55th-annual-grammy-awards-on-february-10-2013-in.jpg?s=612x612&w=0&k=20&c=nAxTPznrcJLJtU5GP1Wndy-vJYC5lIAWbbhUPRohKx8=', credit: 'Christopher Polk/Getty Images for NARAS', caption: '55th Grammy Awards red carpet, February 2013 — a white pleated J. Mendel gown with a silver-trimmed cutout neckline.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/168069917/photo/detroit-mi-taylor-swift-swift-played-the-first-of-13-north-american-stadium-dates-on-the-red.jpg?s=612x612&w=0&k=20&c=MLwDmjrMhFEzEDreloQIwSkojuZjE1GeZjlDKID7JyM=', credit: 'Christopher Polk/TAS/Getty Images for TAS', caption: 'Opening night of the RED Tour\'s North American stadium run, Ford Field, Detroit — a black-and-white striped top with red pants and a red guitar.', kind: 'primary' },
    ],
    shopTags: ['Red lipstick', 'Polka-dot dress', 'Striped top', 'Red pants'],
    sources: [
      { title: 'Who What Wear: Taylor Swift\'s Grammys Fashion Evolution, Explained by a Fashion Editor', url: 'https://www.whowhatwear.com/fashion/celebrity-style/taylor-swift-grammys-red-carpet-fashion-retrospective' },
    ],
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
    description: 'Swift\'s 1989 reinvention centered on two-piece sets: Harper\'s Bazaar says she cut her hair and bought a whole new wardrobe of co-ords, and on June 18, 2014 she stepped out in New York in one of her first, a signature of the album and of her turn to pure pop. At the 57th Grammys in February 2015 she wore a high-low Elie Saab gown (Who What Wear). The album\'s Polaroid-shot packaging, by the photography duo Lowfield, put 13 randomly chosen Polaroids from a set of 65 in each CD.',
    images: [
      { url: 'https://media.gettyimages.com/id/499012186/photo/sydney-australia-taylor-swift-performs-during-her-1989-world-tour-at-anz-stadium-on-november.jpg?s=612x612&w=0&k=20&c=JZtyafJP6uAUFpBE_Wx2omw9vqifSKHPy3U2mZ_rbLU=', credit: 'Mark Metcalfe/Getty Images', caption: 'Performing at ANZ Stadium, Sydney, on the 1989 World Tour, November 2015 — a black crop top and a metallic pleated skirt.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/463018170/photo/los-angeles-ca-singer-taylor-swift-attends-the-57th-annual-grammy-awards-at-the-staples-center.jpg?s=612x612&w=0&k=20&c=G7tt3sh1t8OjpZ3PE-VVI2bhLkr3_FyipXKqtKzeKOw=', credit: 'Jason Merritt/Getty Images', caption: '57th Grammy Awards, February 2015 — a teal high-low Elie Saab gown.', kind: 'primary' },
    ],
    shopTags: ['Crop set', 'Pastel blue', 'Instant camera'],
    sources: [
      { title: 'Harper\'s Bazaar: Taylor Swift\'s Style Evolution Through the Years', url: 'https://www.harpersbazaar.com/celebrity/red-carpet-dresses/g71309753/taylor-swift-complete-style-fashion-evolution/' },
      { title: 'Who What Wear: Taylor Swift\'s Grammys Fashion Evolution, Explained by a Fashion Editor', url: 'https://www.whowhatwear.com/fashion/celebrity-style/taylor-swift-grammys-red-carpet-fashion-retrospective' },
      { title: 'Amateur Photographer: Taylor Swift, 1989 – the story behind the iconic album cover by LOWFIELD', url: 'https://amateurphotographer.com/iconic-images/taylor-swift-1989-the-story-behind-the-album-cover-by-lowfield/' },
    ],
  },
  {
    id: 'look-reputation',
    eraId: 'reputation',
    name: 'Armored Monochrome',
    // A look is defined by its photos (#5353 ruling, #5354). The Puglisi/
    // Cavalli snake catsuit is the 2023 Eras Tour reputation set, not the 2018
    // tour; Footwear News credits the 2018 sequined one-pieces to Jessica
    // Jones with custom Christian Louboutin boots. No photo here shows a
    // snake bodysuit, so none is claimed.
    description: 'Black and sequins in the reputation era: Swift performed on Saturday Night Live in November 2017 in a black jacket and shorts, and on the 2018 Stadium Tour (opened May 8, 2018 in Glendale, Ariz.) wore sequined one-piece outfits by Jessica Jones with custom Christian Louboutin thigh-high boots, per Footwear News. Off-stage at the May 2018 Billboard Music Awards she wore a blush-pink embroidered gown.',
    images: [
      { url: 'https://media.gettyimages.com/id/873082902/photo/saturday-night-live-episode-1730-pictured-musical-guest-taylor-swift-performs-ready-for-it-in.jpg?s=612x612&w=0&k=20&c=I0_V3toxsKgmdYFDEnyjBjSWIQfGpHp2abI0qvTLIgA=', credit: 'Will Heath/NBCU Photo Bank/NBCUniversal via Getty Images', caption: 'Saturday Night Live, November 2017 — black jackets and black shorts for "Ready for It?" amid red stage haze.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1003511368/photo/east-rutherford-nj-taylor-swift-swift-performs-onstage-during-the-taylor-swift-reputation.jpg?s=612x612&w=0&k=20&c=SvMDUJCj_VP457sTHsu4ccsB-Pm7ZEOuEFvp7RnQnS4=', credit: 'Kevin Mazur/TAS18/Getty Images for TAS', caption: 'reputation Stadium Tour, MetLife Stadium, July 2018 — a black sequined long-sleeve one-piece with fishnet tights and thigh-high black boots.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/961777280/photo/billboard-music-awards-red-carpet-arrivals-2018-bbmas-at-the-mgm-grand-las-vegas-nevada.jpg?s=612x612&w=0&k=20&c=Ma4s1at0Recz800B1mzcLzHjZy3jAXC7FZAyluncfnk=', credit: 'Getty Images', caption: '2018 Billboard Music Awards red carpet — a blush-pink gown with embroidered floral appliqué and a thigh-high slit.', kind: 'primary' },
    ],
    shopTags: ['Black bodysuit', 'Thigh-high boots'],
    sources: [
      { title: 'Taylor Swift Kicks Off ‘Reputation’ Tour With Sequins, Snakeskin & Custom Louboutin Boots (Footwear News, via Yahoo, May 10, 2018)', url: 'https://www.yahoo.com/lifestyle/taylor-swift-kicks-off-reputation-202710611.html' },
    ],
  },
  {
    id: 'look-lover',
    eraId: 'lover',
    name: 'Pastel Dreamscape',
    // Source: the Lover album era (2019) press cycle and "ME!"/"You Need
    // To Calm Down" videos leaned into pastel, glitter, and rainbow
    // styling — widely documented in music-video credits and press
    // photography from the era.
    description: 'At the 2019 MTV VMAs, Swift wore a Versace blazer dress in bold colors, prints, and sequins with embellished thigh-high black Christian Louboutin boots, and won Video of the Year for "You Need to Calm Down." Earlier in 2019 she wore a pastel purple Raisa & Vanessa minidress to open the Billboard Music Awards with "ME!" and a rainbow fringe jacket with matching sneakers at iHeartRadio Wango Tango.',
    images: [
      { url: 'https://media.gettyimages.com/id/1170400152/photo/newark-new-jersey-taylor-swift-performs-onstage-during-the-2019-mtv-video-music-awards-at.jpg?s=612x612&w=0&k=20&c=TKdJq3vfNNEq9Toonzypr0yHYsx1sbdhXfLdGq7OFl0=', credit: 'Dimitrios Kambouris/Getty Images for MTV', caption: '2019 MTV VMAs opening performance, Prudential Center, August 2019 — pastel-and-glitter maximalism.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1164293743/photo/us-singer-songwriter-taylor-swift-performs-on-stage-during-2019-mtv-video-music-awards-at-the.jpg?s=612x612&w=0&k=20&c=wB8bBzCahzYMIo_ia3MDAtVjZtMFUaXNURlvBlidO1M=', credit: 'Angela Weiss/AFP via Getty Images', caption: 'The same VMAs night — the rainbow-and-sequin motif from the "ME!"/"You Need To Calm Down" video era.', kind: 'primary' },
    ],
    shopTags: ['Sequin blazer', 'Pastel ombré'],
    sources: [
      { title: 'Billboard: Taylor Swift\'s Style Evolution, From 2006 to Now', url: 'https://www.billboard.com/photos/taylor-swift-style-evolution-photos-429884/' },
    ],
  },
  {
    id: 'look-lover-time-100-j-mendel',
    eraId: 'lover',
    name: 'J. Mendel Time 100 Gala Gown',
    // Source: Vogue (2019-04-24), Harper's Bazaar and ELLE (both 2019-04-23):
    // pale pink and yellow pleated J. Mendel Spring 2019 gown with an oversize
    // puff-sleeve bolero and a Lorraine Schwartz jeweled headband, worn to the
    // Time 100 Gala at Jazz at Lincoln Center, 2019-04-23.
    description: 'On April 23, 2019, Swift arrived at the Time 100 Gala in a pale pink and yellow hand-pleated J. Mendel gown from the label\'s Spring 2019 collection, with an oversize puff-sleeve bolero and a jeweled headband. She performed at the gala in the same dress, an early public look at the Lover era\'s pastel palette.',
    images: [
      { url: 'https://media.gettyimages.com/id/1138974194/photo/new-york-ny-taylor-swift-attends-the-2019-time-100-gala-at-frederick-p-rose-hall-jazz-at.jpg?s=612x612&w=0&k=20&c=bvYN8djE1PvJKtbXz-q3CYfuNdwW-bflyA5Mq9PtZdk=', credit: 'Jamie McCarthy/WireImage', caption: 'The pale pink and yellow J. Mendel gown on the Time 100 Gala red carpet, Jazz at Lincoln Center, April 23, 2019.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1138995178/photo/new-york-ny-taylor-swift-attends-the-2019-time-100-gala-at-frederick-p-rose-hall-jazz-at.jpg?s=612x612&w=0&k=20&c=U_LzasTgIcCVvskxyYiuSNQYLLpE9YhWD-QruIHpPl4=', credit: 'Jamie McCarthy/WireImage', caption: 'Side view of the gown\'s puff sleeve and yellow floral embroidery, Time 100 Gala, April 23, 2019.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1144701016/photo/new-york-new-york-taylor-swift-performs-during-the-time-100-gala-2019-dinner-at-jazz-at.jpg?s=612x612&w=0&k=20&c=GiT2EwqgitEW-3d2lC7gkSwiS6juPoXAKzzE4BrumZs=', credit: 'Dimitrios Kambouris/Getty Images for TIME', caption: 'Performing in the same gown at the Time 100 Gala dinner, April 23, 2019.', kind: 'primary' },
    ],
    shopTags: ['Pleated pastel gown', 'Jeweled headband'],
    sources: [
      { title: 'Vogue: Taylor Swift Wears J. Mendel at the Time 100 Gala in New York City', url: 'https://www.vogue.com/vogueworld/article/taylor-swift-time-100-gala-j-mendel' },
      { title: 'Harper\'s Bazaar: Taylor Swift Looks Like a Disney Princess in Her Pink J. Mendel Gown', url: 'https://www.harpersbazaar.com/celebrity/red-carpet-dresses/a27245670/taylor-swift-j-mendel-gown-time-100/' },
      { title: 'ELLE: Taylor Swift Wore the Ultimate J. Mendel Pastel Princess Dress to Perform at Time 100 Gala', url: 'https://www.elle.com/culture/celebrities/a27245437/taylor-swift-j-mendel-dress-time-100-gala/' },
    ],
  },
  {
    id: 'look-lover-cats-premiere-oscar-de-la-renta',
    eraId: 'lover',
    name: 'Oscar de la Renta Cats Premiere Gown',
    // Source: Teen Vogue (2019-12-17) and Cosmopolitan UK (2019-12-17): ruby
    // floral fil coupé satin Oscar de la Renta gown with pockets, at the Cats
    // world premiere, Alice Tully Hall, New York, 2019-12-16.
    description: 'On December 16, 2019, Swift walked the red carpet at the world premiere of Cats in New York in a strapless ruby floral fil coupé satin gown by Oscar de la Renta, a full-skirted dress with pockets that Teen Vogue singled out, paired with Chloe Gosselin shoes and Maxior earrings.',
    images: [
      { url: 'https://media.gettyimages.com/id/1189043623/photo/topshot-us-singer-taylor-swift-arrives-for-the-world-premiere-of-cats-at-the-alice-tully-hall.jpg?s=612x612&w=0&k=20&c=TxKB30hcnzUAdrrKnwYGJ7vq2VU66wWwYVUG_yarzlY=', credit: 'Angela Weiss/AFP via Getty Images', caption: 'The red floral Oscar de la Renta gown at the world premiere of Cats, Alice Tully Hall, New York, December 16, 2019.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1194380161/photo/new-york-new-york-taylor-swift-attends-the-world-premiere-of-cats-at-alice-tully-hall-lincoln.jpg?s=612x612&w=0&k=20&c=msjv2z5zkcKY_Mi4ui0PCEkuaPprYOAO5iWJdHh1qNs=', credit: 'Steven Ferdman/Getty Images', caption: 'Full-length view of the gown and its dark floral train, Cats world premiere, December 16, 2019.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1194381062/photo/new-york-new-york-taylor-swift-attends-the-cats-world-premiere-at-alice-tully-hall-lincoln.jpg?s=612x612&w=0&k=20&c=3dT4uxlOnes2R--K2hVwbC8Rba-rRUg9sU3I6PZpgWY=', credit: 'Theo Wargo/WireImage', caption: 'The strapless bodice and full skirt of the Oscar de la Renta gown, Cats world premiere, December 16, 2019.', kind: 'primary' },
    ],
    shopTags: ['Floral satin gown', 'Strapless ball skirt'],
    sources: [
      { title: 'Teen Vogue: Taylor Swift Stunned at the Cats Premiere with a Gorgeous Dress', url: 'https://www.teenvogue.com/story/taylor-swift-cats-premiere' },
      { title: 'Cosmopolitan UK: Taylor Swift wears a festive Oscar de la Renta dress for \'Cats\' premiere', url: 'https://www.cosmopolitan.com/uk/fashion/celebrity/a30252174/taylor-swift-dress-cats-premiere/' },
    ],
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
    description: 'In the 2020 "cardigan" video, Swift warms up in an oversized white chunky-knit varsity cardigan, the piece the song is named for. Her store sold a $49 cream cable-knit take on it, with light-gray star embroidery on both arms and a "the folklore album" patch, as folklore arrived at midnight on July 24, 2020.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307122077/photo/los-angeles-california-taylor-swift-winner-of-the-album-of-the-year-award-for-folklore.jpg?s=612x612&w=0&k=20&c=8Z1VYOY-Yc9qqWC8LYlHMDBpJd03w6R2p_QKc_ZkSWY=', credit: 'Kevin Mazur/Getty Images for The Recording Academy', caption: '63rd Grammys media room, March 2021, the night folklore won Album of the Year — soft, muted press-room styling.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1230196449/photo/jimmy-kimmel-live-jimmy-kimmel-live-airs-every-weeknight-at-11-35-p-m-est-and-features-a.jpg?s=612x612&w=0&k=20&c=4xSmOy8X1s88VPpsUQ5tCpVmrgHW7ZTDivXXyN2u984=', credit: 'Randy Holmes/ABC via Getty Images', caption: 'Promoting Disney+\'s Folklore: The Long Pond Studio Sessions, December 2020 — the cottagecore-cardigan press cycle.', kind: 'primary' },
    ],
    shopTags: ['Cardigan', 'Prairie dress'],
    sources: [
      { title: 'Vogue: Taylor Swift Writes a Song Called “Cardigan,” and Makes Merch to Match', url: 'https://www.vogue.com/article/taylor-swift-cardigan-merch' },
      { title: 'Vulture: Taylor Swift Wants to Sell You a ‘Cardigan’ Cardigan', url: 'https://www.vulture.com/2020/07/taylor-swift-merch-store-cardigan-album-bundle.html' },
      { title: 'ELLE: All the Easter Eggs in Taylor Swift\'s \'Cardigan\' Music Video', url: 'https://www.elle.com/culture/music/g33414383/taylor-swift-cardigan-music-video-easter-eggs/' },
    ],
  },
  {
    id: 'look-folklore-grammys-red-carpet',
    eraId: 'folklore',
    name: 'Oscar de la Renta Grammys Florals',
    // Source: Vogue (2021-03-15) and W (2021-03-14/15): Oscar de la Renta
    // floral-appliqué dress on the 63rd Grammys red carpet, 2021-03-14,
    // with a customized floral face mask.
    description: 'On March 14, 2021, Swift arrived at the 63rd Grammy Awards in a floral-appliqué Oscar de la Renta dress, adding a customized floral face mask once inside. The botanical detailing carried folklore\'s woodland imagery onto the red carpet on the night the album won Album of the Year.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307105622/photo/los-angeles-california-taylor-swift-attends-the-63rd-annual-grammy-awards-at-los-angeles.jpg?s=612x612&w=0&k=20&c=gFnBHJ5x9CBI3yg7HhFG9LCrxa14TYpPTJAwomUeJ3Q=', credit: 'Kevin Mazur/Getty Images', caption: 'The Oscar de la Renta floral-appliqué mini dress with pink ribbon sandals on the 63rd Grammys red carpet, March 14, 2021.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1307106790/photo/los-angeles-california-taylor-swift-attends-the-63rd-annual-grammy-awards-at-los-angeles.jpg?s=612x612&w=0&k=20&c=B46Jfax-NsJxpfSeWUYC3erF01GhafNBgdyekcBTDwE=', credit: 'Kevin Mazur/Getty Images', caption: 'Side view of the Oscar de la Renta dress and its layered flower appliqué, 63rd Grammys, March 14, 2021.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1307122077/photo/los-angeles-california-taylor-swift-winner-of-the-album-of-the-year-award-for-folklore.jpg?s=612x612&w=0&k=20&c=8Z1VYOY-Yc9qqWC8LYlHMDBpJd03w6R2p_QKc_ZkSWY=', credit: 'Kevin Mazur/Getty Images for The Recording Academy', caption: 'Holding her Album of the Year Grammy for folklore in the same Oscar de la Renta floral dress, 63rd Grammys media room, March 14, 2021.', kind: 'primary' },
    ],
    shopTags: ['Floral appliqué dress', 'Floral face mask'],
    sources: [
      { title: 'Vogue: Taylor Swift\'s Floral Dress From the Grammy Awards Is Available for Purchase Online', url: 'https://www.vogue.com/article/taylor-swift-floral-grammy-dress-oscar-de-la-renta' },
      { title: 'W: Grammys 2021: Taylor Swift Conjured Cottagecore for Her Performance', url: 'https://www.wmagazine.com/culture/taylor-swift-grammys-performance-folklore' },
    ],
  },
  {
    id: 'look-folklore-grammys-etro',
    eraId: 'folklore',
    name: 'Etro Mossy-Ground Performance Gown',
    // Source: Vanity Fair (2021-03-14) and W (2021-03-15): custom Etro
    // sequined gown with ruffled hemline and sleeves, purple and gold,
    // worn for the "cardigan"/"august"/"willow" performance at the 63rd
    // Grammys, 2021-03-14.
    description: 'For her 63rd Grammys performance on March 14, 2021, Swift wore a custom, sequined purple-and-gold Etro gown with a ruffled hemline and sleeves and a thin golden headpiece. She performed "cardigan," "august," and "willow" with Jack Antonoff and Aaron Dessner, beginning on a moss-covered set that staged folklore\'s cottagecore world live.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307107698/photo/los-angeles-california-in-this-image-released-on-march-14-taylor-swift-performs-onstage-for.jpg?s=612x612&w=0&k=20&c=tSXS2cDZuIiO6hOsdBlz5ClyTS44kuywHGxtvubYD64=', credit: 'TAS Rights Management 2021, via Getty Images', caption: 'Performing in the Etro gown on the moss-roofed cabin set, 63rd Grammys broadcast, March 14, 2021.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1231739449/photo/taylor-swift-performing-at-the-63rd-annual-grammy-awards-broadcast-live-from-the-staples.jpg?s=612x612&w=0&k=20&c=r_yoDVLuXt13SSHp7KLdo_Mmemy9b4qMPHNu9NLrE5k=', credit: 'CBS Photo Archive/CBS via Getty Images', caption: 'Close-up of the sequined Etro gown and golden headpiece during the 63rd Grammys performance, March 14, 2021.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1307107711/photo/los-angeles-california-in-this-image-released-on-march-14-jack-antonoff-taylor-swift-and.jpg?s=612x612&w=0&k=20&c=_H7_PGk3-xd9P-AymCSVKHCTI-3s_Gkfy9bgJz-9CqI=', credit: 'TAS Rights Management 2021, via Getty Images', caption: 'Full-length in the Etro gown with Jack Antonoff and Aaron Dessner on the cabin set, 63rd Grammys broadcast, March 14, 2021.', kind: 'primary' },
    ],
    shopTags: ['Sequined gown', 'Gold headpiece'],
    sources: [
      { title: 'Vanity Fair: Taylor Swift Takes Her New Stripped-Down Sound to the Grammy 2021 Stage', url: 'https://www.vanityfair.com/style/2021/03/taylor-swift-grammy-2021-stage' },
      { title: 'W: Grammys 2021: Taylor Swift Conjured Cottagecore for Her Performance', url: 'https://www.wmagazine.com/culture/taylor-swift-grammys-performance-folklore' },
    ],
  },
  {
    id: 'look-evermore',
    eraId: 'evermore',
    name: 'Autumn Flannel',
    // Source: evermore (2020) was explicitly framed by Swift as folklore's
    // "sister record," and its era styling followed suit with rustic
    // autumnal tones — documented in the album's own visual rollout.
    description: 'When Swift announced evermore on December 10, 2020, calling it folklore\'s "sister record," the album artwork showed her in a plaid pea coat from Stella McCartney\'s 2020 collection, her blond hair in a single braided French plait, at the edge of a woodland. British Vogue read the cosy checks as a continuation of folklore\'s cottagecore-inflected approach.',
    images: [
      { url: 'https://media.gettyimages.com/id/1307107698/photo/los-angeles-california-in-this-image-released-on-march-14-taylor-swift-performs-onstage-for.jpg?s=612x612&w=0&k=20&c=tSXS2cDZuIiO6hOsdBlz5ClyTS44kuywHGxtvubYD64=', credit: 'TAS Rights Management 2021, via Getty Images', caption: '63rd Grammys broadcast performance, March 2021 — the rustic-autumnal costume for the "willow"/"august"/"cardigan" medley.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2163401668/photo/london-england-an-outfit-worn-by-taylor-swift-in-the-willow-music-video-on-display-at-the.jpg?s=612x612&w=0&k=20&c=CNcGuN7SAhF9FTpFsILiccqbV4-UhUZLNb37xxFg_Jc=', credit: 'Gareth Cattermole/Getty Images', caption: 'The actual Zimmermann costume worn in the 2020 "willow" video, on display at the V&A\'s Taylor Swift Songbook Trail, 2024.', kind: 'primary' },
    ],
    shopTags: ['Flannel', 'Braided hair'],
    sources: [
      { title: 'British Vogue: In Cosy Stella McCartney Checks, Taylor Swift Announces A Surprise Second 2020 Album', url: 'https://www.vogue.co.uk/news/article/taylor-swift-evermore' },
      { title: 'Vanity Fair: Fashion Inspired by Taylor Swift\'s Evermore', url: 'https://www.vanityfair.com/style/photos/2020/12/fashion-inspired-by-taylor-swifts-evermore' },
    ],
  },
  {
    id: 'look-evermore-willow-zimmermann',
    eraId: 'evermore',
    name: 'Willow Zimmermann Lace Gown',
    // Source: British Vogue (2020-12-10) and Elle (2020-12-11): ivory lace
    // Zimmermann Charm Star gown with a flower crown / Jennifer Behr bridal
    // headpiece, shared ahead of the "willow" video; Vanity Fair
    // (2020-12-11) shows the same dress in evermore album imagery.
    description: 'On December 10, 2020, hours before the "willow" video premiered, Swift shared a photo in an ivory lace Zimmermann gown, the Charm Star dress, with a pearly flower crown. The bridal-looking silhouette led many fans to guess a wedding announcement before the video arrived.',
    images: [
      { url: 'https://media.gettyimages.com/id/2163401668/photo/london-england-an-outfit-worn-by-taylor-swift-in-the-willow-music-video-on-display-at-the.jpg?s=612x612&w=0&k=20&c=CNcGuN7SAhF9FTpFsILiccqbV4-UhUZLNb37xxFg_Jc=', credit: 'Gareth Cattermole/Getty Images', caption: 'The actual Zimmermann costume worn in the 2020 "willow" video, on display at the V&A\'s Taylor Swift Songbook Trail, 2024.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/2162672498/photo/london-united-kingdom-a-costume-design-by-zimmerman-worn-by-taylor-swift-in-willow-music.jpg?s=612x612&w=0&k=20&c=RflXJYeEf39djelAYbbgkoGpIoM7oqodfP4C0EKSY6c=', credit: 'Wiktor Szymanowicz/Future Publishing via Getty Images', caption: 'The same Zimmermann costume from the 2020 "willow" video, second view, at the V&A Taylor Swift Songbook Trail, London, July 24, 2024.', kind: 'primary' },
    ],
    shopTags: ['Lace maxi dress', 'Flower crown'],
    sources: [
      { title: 'British Vogue: In Cosy Stella McCartney Checks, Taylor Swift Announces A Surprise Second 2020 Album', url: 'https://www.vogue.co.uk/news/article/taylor-swift-evermore' },
      { title: 'Elle: All the Easter Eggs in Taylor Swift\'s "Willow" Video Explained', url: 'https://www.elle.com/culture/music/g34943325/taylor-swift-willow-music-video-easter-eggs/' },
      { title: 'Vanity Fair: Fashion Inspired by Taylor Swift\'s Evermore', url: 'https://www.vanityfair.com/style/photos/2020/12/fashion-inspired-by-taylor-swifts-evermore' },
    ],
  },
  {
    id: 'look-midnights',
    eraId: 'midnights',
    name: 'Midnight Glam',
    // Source: the "Bejeweled" video (2022) and Midnights press cycle used
    // deep-blue, retro-glam sequined styling — widely documented in the
    // video's own credits and press coverage.
    description: 'Harper\'s Bazaar sums up the Midnights era as deep blues with sparkling accents. At the 2022 MTV VMAs Swift accepted Video of the Year for "All Too Well: The Short Film" in a sheer, crystal-beaded Oscar de la Renta dress with matching shoes, and at the MTV EMAs on Nov. 13, 2022 she wore a black bodysuit with a David Koma chainmail skirt detailed in green jewels. The sparkle carried onto the Eras Tour, where Billboard notes her bejeweled bodysuits and knee-high boots.',
    images: [
      { url: 'https://media.gettyimages.com/id/1418923160/photo/newark-new-jersey-taylor-swift-accepts-the-video-of-the-year-award-for-all-too-well-onstage.jpg?s=612x612&w=0&k=20&c=E6UsqO3HGj62L9IfUKzTKWIJFiO21z9WHl8583qqKgc=', credit: 'Kevin Mazur/Getty Images for MTV/Paramount Global', caption: '2022 MTV VMAs, August 2022 — a sheer crystal-beaded Oscar de la Renta gown, worn the night she announced Midnights minutes later.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1801109903/photo/sao-paulo-brazil-taylor-swift-performs-onstage-during-taylor-swift-the-eras-tour-at-allianz.jpg?s=612x612&w=0&k=20&c=cckANjdYrCz8rTv_ePOsBTNJSjjEryBkG4SZf7mbSwg=', credit: 'Buda Mendes/TAS23/Getty Images for TAS Rights Management', caption: 'The Eras Tour, Sao Paulo, November 2023 — a crystal-covered silver-and-blue bodysuit with matching knee-high boots.', kind: 'primary' },
    ],
    shopTags: ['Sequin jumpsuit', 'Jewel tones'],
    sources: [
      { title: 'Harper\'s Bazaar: Taylor Swift\'s Style Evolution Through the Years', url: 'https://www.harpersbazaar.com/celebrity/red-carpet-dresses/g71309753/taylor-swift-complete-style-fashion-evolution/' },
      { title: 'Billboard: Taylor Swift\'s Style Evolution, From 2006 to Now', url: 'https://www.billboard.com/photos/taylor-swift-style-evolution-photos-429884/' },
    ],
  },
  {
    id: 'look-midnights-grammys-cavalli',
    eraId: 'midnights',
    name: 'Roberto Cavalli Midnight-Blue Grammys Set',
    // Source: Cosmopolitan UK (2023-02-06) and Harper's Bazaar retrospective
    // (slide dated 2023-02-05): midnight-blue sparkling Roberto Cavalli
    // long-sleeve crop top and skirt, 65th Grammy Awards red carpet, 2023-02-05.
    description: 'On February 5, 2023, Swift arrived at the 65th Grammy Awards in a sparkling midnight-blue Roberto Cavalli set, a long-sleeve crop top and floor-length skirt with a train, a nod to her album Midnights, released the previous October. Cosmopolitan UK reports it was styled with Lorraine Schwartz jewelry including purple sapphire earrings.',
    images: [
      { url: 'https://media.gettyimages.com/id/1463248197/photo/los-angeles-california-taylor-swift-attends-the-65th-grammy-awards-on-february-05-2023-in-los.jpg?s=612x612&w=0&k=20&c=CfmgejcseRQwymxxfwCJLv5gKVFB73xwnEj2XZhmprY=', credit: 'Kevin Mazur/Getty Images for The Recording Academy', caption: 'The midnight-blue sparkling crop top and train skirt on the 65th Grammys red carpet, February 5, 2023.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1463248117/photo/los-angeles-california-taylor-swift-attends-the-65th-grammy-awards-on-february-05-2023-in-los.jpg?s=612x612&w=0&k=20&c=7eDy9ipZwL9mpzkqjGAvE6WKgOfkILTTEgAEqGh8Vn0=', credit: 'Amy Sussman/Getty Images', caption: 'Three-quarter view of the beaded navy set, 65th Grammy Awards, February 5, 2023.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1463250402/photo/los-angeles-california-taylor-swift-attends-the-65th-grammy-awards-on-february-05-2023-in-los.jpg?s=612x612&w=0&k=20&c=edrvXzbeevI6u5I69_E-Q61KjCDisputcvKjJjCkLSc=', credit: 'Jon Kopaloff/WireImage', caption: 'Front view of the long-sleeve navy sequined top and skirt, 65th Grammy Awards, February 5, 2023.', kind: 'primary' },
    ],
    shopTags: ['Midnight-blue crop set', 'Sequined mermaid skirt'],
    sources: [
      { title: 'Cosmopolitan UK: Taylor Swift\'s Grammy dresses throughout the years', url: 'https://www.cosmopolitan.com/uk/fashion/celebrity/g15388341/taylor-swifts-grammy-looks-throughout-the-years/' },
      { title: 'Harper\'s Bazaar: Taylor Swift\'s Style Evolution Through the Years', url: 'https://www.harpersbazaar.com/celebrity/red-carpet-dresses/g65668036/taylor-swift-style-fashion-evolution-1755025743/' },
    ],
  },
  {
    id: 'look-midnights-iheartradio-vauthier',
    eraId: 'midnights',
    name: 'Alexandre Vauthier iHeartRadio Jumpsuit',
    // Source: ELLE UK (2023-03-29) and Teen Vogue (2023-03-28): hooded,
    // sparkling Alexandre Vauthier couture jumpsuit worn to accept the
    // Innovator Award at the iHeartRadio Music Awards, Dolby Theatre, 2023-03-27.
    description: 'On March 27, 2023, Swift accepted the Innovator Award at the iHeartRadio Music Awards at the Dolby Theatre in a hooded, sparkling Alexandre Vauthier couture jumpsuit. ELLE UK read the glitter as a blend of reputation-era aesthetic and Midnights "Bejeweled" sparkle.',
    images: [
      { url: 'https://media.gettyimages.com/id/1477344532/photo/hollywood-california-honoree-taylor-swift-accepts-the-iheartradio-innovator-award-onstage.jpg?s=612x612&w=0&k=20&c=1koqACXgsFzLFjSAys_TjG9FATpFbgyNKXE3WpsBRfw=', credit: 'Monica Schipper/Getty Images for iHeartRadio', caption: 'Accepting the iHeartRadio Innovator Award in the hooded sparkling jumpsuit, Dolby Theatre, March 27, 2023.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1477316502/photo/hollywood-california-taylor-swift-accepts-the-innovator-award-at-the-2023-iheartradio-music.jpg?s=612x612&w=0&k=20&c=QW8gFO31wR7IXXfzyI7z4ktmW6Gtp28unWVZSb5JYQM=', credit: 'Jeff Kravitz/FilmMagic', caption: 'Close view of the sparkling hooded jumpsuit during her Innovator Award speech, March 27, 2023.', kind: 'primary' },
      { url: 'https://media.gettyimages.com/id/1477295565/photo/los-angeles-california-honoree-taylor-swift-accepts-the-iheartradio-innovator-award-from.jpg?s=612x612&w=0&k=20&c=iLLwd8lYRqQoc3Rx6EvrYWuIJHxa0tXbJqCXkGZghSA=', credit: 'Kevin Winter/Getty Images for iHeartRadio', caption: 'Receiving the Innovator Award from Phoebe Bridgers in the same jumpsuit, iHeartRadio Music Awards, March 27, 2023.', kind: 'primary' },
    ],
    shopTags: ['Hooded jumpsuit', 'Sparkling couture'],
    sources: [
      { title: 'ELLE UK: Taylor Swift Gave A Great Speech On Giving Yourself ‘Permission To Fail’ At The 2023 iHeartRadio Music Awards', url: 'https://www.elle.com/uk/life-and-culture/a43447960/taylor-swift-iheartradio-music-awards-outfit-speech-failure/' },
      { title: 'Teen Vogue: Taylor Swift Wears Alexandre Vauthier Couture to iHeartRadio Music Awards 2023 — See Photos', url: 'https://www.teenvogue.com/story/taylor-swift-iheartradio-music-awards-2023' },
    ],
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
