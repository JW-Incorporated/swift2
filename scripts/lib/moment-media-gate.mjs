// Every newly published moment needs authored visual media. These are the
// stable keys and exact content hashes of older rows that predate the rule.
// Editing one invalidates its exemption, so fresh prose cannot ship without
// adding media. The migration ledger is docs/content/historical-media-
// migration-2026-09-15.md; content-only changes cannot add an exemption.
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { slugify } from './longlive-sync-shared.mjs';

export const MEDIA_LEGACY = new Map([
]);

// Exact snapshots of text-only rows that predate P1-23. A new row, or any
// edit to one of these rows, must add renderable media. The compact encoding
// keeps this gate reviewable without letting the legacy corpus dominate the
// module; content-only changes cannot add entries here.
const SURFACE_MEDIA_LEGACY_TEXT = `
releases/releases.mjs#taylor-swift|544fd23192274b2781e7c2ac31e7d02183df0a07024237dc63a3390faeb91fab;releases/releases.mjs#napster-live|30cbfc61123748ec76203d6a11cf448022efad73fabb0225d378b7a66c8b0d17;releases/releases.mjs#the-taylor-swift-holiday-collection|fd167fdbd76e5e614fb4e5ebd0fd20fb9dee8d58bb3ee4226d3af6b61cbdaba5
releases/releases.mjs#itunes-live-from-soho|90a9173c1106550a15cd3c41e645a244f8ca2372eda68304b3a6b4d78dbc259d;releases/releases.mjs#beautiful-eyes|8e4d1853b934ce84ca41bee14e7986ff6b698161ee10dd693bc0ba1497d60432;releases/releases.mjs#fearless|16cbde176e6406fb78f04a6ecac67cf3e58eaaeec7c488f4cb783e1a2f5dcbef
releases/releases.mjs#fearless-platinum-edition|d45bdfce77060943847a7e608ddb3ce51352561bbe30b6b13e341d9083cd21d9;releases/releases.mjs#speak-now|fdb3cb0344fe13ee7e2c56a2e2e8ff7784e6f9a5e2ac478477256c7b0ea4a8e2;releases/releases.mjs#speak-now-world-tour-live|3219f91cf15e68c155ac3dc7f171667562dfb933f2c611f49493dfecaab5b736
releases/releases.mjs#red|4ec649065b8982db38fba8387a61654a037e9bdadb50cb0bff77ec6e0b362226;releases/releases.mjs#1989|95cf542aeb783df108b5511a7d721dc3fab37b71fabe6e9ca51aec224c7877fe;releases/releases.mjs#reputation|a254b18550c75e35a5aa8b072b4bee42cd7e48796c4da799c9b19e4329c0ff4a
releases/releases.mjs#spotify-singles|48a5ce3fee760e5d355302daef040a7b0c0960e27f7cb35e5b199b05c43d509c;releases/releases.mjs#lover|aed9e8945ae9c149e6714b1e8190c34b823d478f1e9c8685d54202958864127d;releases/releases.mjs#live-from-clear-channel-stripped-2008|d3d1cf509ac784a57b881709acf8ceeee3d0353f1f9892d6e7fefdc6ef2614cf
releases/releases.mjs#folklore|fbae77d43e5947f83500e194390d2179c3fb5e4777b0b15f3f1db5906b5b64c5;releases/releases.mjs#folklore-the-long-pond-studio-sessions|cb7a874f32c5f6f5fe348707b99bc1991d0bf7452b9579f9b75f1a916398ae72;releases/releases.mjs#evermore|d5937b6a93cb907aa3fe2d87e345a92e2da457d50f1e43f0441fa0622a6f32f9
releases/releases.mjs#fearless-taylors-version|f9970cbe1d75573b8e505ec74e8343f7507ff2b40950d695cd5fe4030e0e26cd;releases/releases.mjs#red-taylors-version|fb6bdb8520d5ba6fab458a559b3e95f5f0f58991aea709f9abecf5cd2433460a;releases/releases.mjs#midnights|0d83cad5daca7e2516fd8c55435e0794dea9857dfbfdecaf3755ca8b0d3e0829
releases/releases.mjs#midnights-3am-edition|04a293a397ee640dc8a1054ce9ed329bd688bd46c7e61c7cbf43a5928b9a257d;releases/releases.mjs#lover-live-from-paris|4de2956e459c62769df5bb0e96a069fb1eb8d61a092719c6ca62b9637f92df67;releases/releases.mjs#midnights-the-til-dawn-edition|d7388ae7605f82d5f48e441cf7c6dfa4d950cf3ac52cc1c0cab58fb5ef36ffa3
releases/releases.mjs#speak-now-taylors-version|531cd5049fd25618a81c5b7d19fbe41c6cbee3cf424d83afab67647ce431094e;releases/releases.mjs#1989-taylors-version|a99aeed7adffaf315ce77e37c8f361ae0ed3db7b9c9374abbd8259af2765e303;releases/releases.mjs#the-tortured-poets-department|d0a25ddf064fa893219c6d73f3232e4513f66549a7f05c3477b0a8222e6cf228
releases/releases.mjs#ttpd-the-anthology|52bbfe787adfd1ce41d241f335e4ba1542d4931f24bdbd1896967be1d076a893;releases/releases.mjs#the-life-of-a-showgirl|81b8018220d17f6afbe19f597beb4653611f5b18b7e47bb939f6cd1ad2efad7f;tours/tours.mjs#fearless-tour|9991be8f92e7ed2d8b08b28fb1aff5427f536e032964ccc148ed1800538374ce
tours/tours.mjs#speak-now-world-tour|e3d156363f65f0b869ceaadc566970450ed45dff0d1d8ec129b1121dcd0cfc83;tours/tours.mjs#the-red-tour|fbb7c5c2dbe649dc2e789db1f8250d1969046616caf2b3d63b05dd4836b59edf;tours/tours.mjs#the-1989-world-tour|9c561bbd781990778ce5b365c0600d3326f417a7bdd6884df596f5e3f7f1bddc
tours/tours.mjs#reputation-stadium-tour|ec75773242086f1478d01f3c117e1cfed23f1074c3e90fb6d74762e88e8c9ac7;tours/tours.mjs#the-eras-tour|8f28631a23a2511a34606f009302ff43694fa2d3e0905d7099e8576fead8736c;theories/1989.mjs#no-its-becky|6f752ddb5eaaba25072871626d7c61d0306a5abd9ec775cf3d87dade5eff50ad
theories/1989.mjs#1989-lowercase-liner-codes|1ee087eabea7bdea2d96e73f0ab91d6aa72b193246cbda270be053f949951d9d;theories/1989.mjs#1989-polaroid-cover|285a578ee8a421e78d6f6ffa3b027aa7d88155cfc384ad14b1547b5d04b15729;theories/1989.mjs#1989-deluxe-voice-memos|415036ff5ca3fd50c956fe0fc2ffe301c7b1c5ff8f1cceacda855d51322ca86f
theories/1989.mjs#blank-space-media-caricature|541c859df98486c1b02126008d6bb01a5e122c15f2f0746cb1d1eb0447e139d8;theories/1989.mjs#blank-space-starbucks-lovers|252734dba543f480451ce7804c233d46af754186154a379238ad877423d97ff0;theories/debut.mjs#lucky-number-13|ae2447c5dc1670d5c9da270f2203bbd18d8e81f3a2f03ead6f82e2ec113cd991
theories/debut.mjs#liner-notes-hidden-messages|61ae45d87862d0c98e0c5d2db392fd7a8726bf7ea91888b89a6bd97075ce00dd;theories/debut.mjs#tim-mcgraw-debut-single-nested-clue|88cfaa7a0339bf94cad53a8be7df69199719084e96c51c4321e3a7f76a8551b6;theories/debut.mjs#the-outside-first-song-outcast|83c2f7f096e053d0e05ee7c3feec47eeec34c26590bf98af8cf2ed77007b364c
theories/debut.mjs#a-place-in-this-world-mission-statement|2592e144f51d0a321ed795fbe200e8398bdeeaae971adf2f88668c194eabed44;theories/evermore.mjs#thirteen-backwards|01f9232145b2888d1cb4be6815a903a11b7592c2a4e3af1973d000beeb032aea;theories/evermore.mjs#dorothea-and-the-love-triangle|1eca5d22c8bef43c0c3a49f883291171ae87b14d642e1500262bb44f3b4a1730
theories/evermore.mjs#ivy-the-affair-narrative|b0c563ea020d555516027cd1733fa957a81624f76ebcd3ee9cb79dcf0634fce0;theories/evermore.mjs#cowboy-like-me-two-con-artists|a040e2c14810d25c4548534122409ccbb5fc312d60b28198efe8a7d800c0e4ef;theories/evermore.mjs#closure-discomfort-by-design|4f291894cd35c038cdf796083f458b446d44ecefa3b943fbc35df892d3b9e260
theories/evermore.mjs#evermore-bonus-tracks-true-ending|cce9159d486716682e3a2fd229463fa4733efd8889318a67b179fda076daf9ee;theories/evermore.mjs#marjorie-grandmothers-vocals|8db74eb9824b7001978e18147ac767486e612789033e5f4cced69e86b01270b7;theories/fearless.mjs#the-best-day-liner-note-code|612e97e9505e13433957b49a06a47609c3a24beaf8f3482ab0e5c5bc2735882d
theories/fearless.mjs#vault-track-anagram-reveal|992bc624a20faf47ed8b55670d2b0ce79707d2049e7840e83bcdf966108055f4;theories/fearless.mjs#the-best-day-surprise-home-video|7fb1d46cf16e72ffaceb688b173edef7d8f755183fc43d772616b1053842f675;theories/fearless.mjs#love-story-rewritten-ending|85c74c6326f5251e0202e174a2e9c078b4d284d314d8347de36a8eb923bc89df
theories/fearless.mjs#change-underdog-anthem|bcb8829efa81aef8f3280085e6fcf5796ec983b4eb4ebe84061b33dcca912b82;theories/folklore.mjs#woodvale|1ba22354e0d46f0f4b6888a3835dd4861c1185a007292160838041a28116a83b;theories/folklore.mjs#teenage-love-triangle|83404080347ad4bb52435eb863ed94983216e811d5f115dd888b5390c733acb9
theories/folklore.mjs#william-bowery|d2affd415938a0c26e91876c73ee91bf6bd3669ea1c4edf0092f4a5ad43e772d;theories/lover.mjs#butterfly-mural|e56231631714cc1d1005fcb94ab77f49d1271a05ec524f734581ec0593149e04;theories/lover.mjs#mastermind-doctrine|947c59acb7ac1e2e45b7f6efcf317e6256e02cd216ef121862ebac368bacc2e8
theories/lover.mjs#me-video-chicks-painting|7af6dcb47e46a6baaaaa52dfbe459d5413872185274c4993945959231d554c2c;theories/lover.mjs#the-man-karma-graffiti|22ec2e25114501cce1b415356a1dfdf232276c14c405dfdcb7c12b1883627f38;theories/lover.mjs#lover-house-eras-map|5a9623bbda54073781178435167bd94b59d3804055b8815b45853088ce42e721
theories/midnights.mjs#karma-lost-album|9d56c27b12a09df73e2aa0da02414593e4dc511bb9703c34162c27eae21f766e;theories/midnights.mjs#bejeweled-speak-now-clues|5e3fc4a7c3764d5017cd864573e000030d7ee4b9dfbada2dc27768857a4ea690;theories/midnights.mjs#vault-puzzles-1989|517506e01f34a82aed89f8eec3af81dc7639dd90f5988c1cfd85a9ee3879bd70
theories/midnights.mjs#eight-nine-sofi|593aaa1a808b11c7911d71ed92205c0019fbb46076744efc4f80973fec1bcd4f;theories/midnights.mjs#album-color-canon|99507df76b4f22b3d5b1626c9632c64ee9172e2e6cf1a19645f402f2a0feab34;theories/midnights.mjs#surprise-song-metagame|d00e082e441e05bbc8c7e4fda10d336e677d921897e24fc05bf2ad5cf0abd823
theories/midnights.mjs#friendship-bracelets|6f82be656e3cd8ef3b21e95835b53a76205372a94792747cf830e7541ca2c409;theories/red.mjs#twenty-two-liner-note-code|728f4bc1f2e58ac05e04d94069cac872c696f40703bb166b7ccba83929515164;theories/red.mjs#vault-track-word-puzzle-reveal|243f2c09c7d687d1b16d2ef9e1df00bddbca85b807c5eb934ce91b1f41fd2694
theories/red.mjs#not-a-lot-going-on-shirt|15764c51b9c849ed31952915ff7a8acb645d75882f9195e8e9fe0c12fd94c16b;theories/red.mjs#i-bet-you-think-about-me-video-eggs|29dd8967dc5c5da58b4d18d9a179047ad6795147af4ea184854d4af9502337e3;theories/red.mjs#all-too-well-original-ten-minutes|1b875d7e311666216e879a8d280fbd2ac9e663d28a17ba626aa8201978b542ae
theories/red.mjs#i-bet-you-think-about-me-rerecord-clues|35cbb710bef2581944d2c64dd93f0c7a20dbdaada88949d6054371467a57034e;theories/reputation.mjs#snake-reclamation|e1ca1222aa648ab9863f57470d1055eacd9f4c851b932a49baa56b061be349f7;theories/reputation.mjs#lwymmd-nils-sjoberg-gravestone|dfdaddf3ec1fd28dbc9559c193c238f01d61fbe9099e3119f73b1424034d25b6
theories/reputation.mjs#lwymmd-dollar-bill|66734b7e0a841f0c5c2ed46a4f94f1860c06e070218e785d3dd1c5d4b814b72f;theories/reputation.mjs#old-taylors-ending|384a67504a06582f8f00287d8805c814f6813d3ef7815573587c66118d13aea7;theories/reputation.mjs#lwymmd-et-tu-brute|1eca57699b24c4211dc0e937bb080fd542ab4d2b3302b2907d378ebac2ca9781
theories/reputation.mjs#reputation-tabloid-cover|14067f2b9e573eecc73d84e4a008637b87bf7866ece0ee3a88d39f0a1fbb8ee9;theories/speak-now.mjs#never-grow-up-liner-note-code|530d5fb042df69127a3c3088c186a8128766fa54eeb1a642b2eb0742cb2719e8;theories/speak-now.mjs#speak-now-tv-tracklist-reveal|79d7329d97bff87861ec8f516d79f4d2eaa7fd13698ba7783b21bee7934c4141
theories/speak-now.mjs#mine-leak-rush-release|4fcc8af3c43eaeb99e2f0d9ab7f40f64f9b2c7b290de10b9a0312a18285e8ece;theories/speak-now.mjs#speak-now-tour-surprise-covers|b8039cda2cd63148cf3f2ac33d2ab1d403fe2de5a84a5319a0f568088261eb80;theories/speak-now.mjs#speak-now-written-entirely-alone|f22bebb7848d489aeb6d367e01fc439df9ede7a09a847c763ed07bae9665e7d7
theories/speak-now.mjs#long-live-band-and-fans-tribute|b75eed3c801c91fddfca6e440d6909756baffe16e028e3f2c82cff3cd8d4f87c;theories/the-life-of-a-showgirl.mjs#orange-era-clues|87a09d25093f2e23d9541dd04876f93103fe08ee326b808152c951e56e94aef8;theories/the-life-of-a-showgirl.mjs#ophelia-rewrite|cb612788a2d5e6f2aeff377d02fde8a08d3f490c0fe015f22c3d53318938ed65
theories/the-life-of-a-showgirl.mjs#father-figure-george-michael-interpolation|d21087f9ee89cec66bd3f4fa850bb8773a57b342d53d96db1f5c8d23f3579c44;theories/the-life-of-a-showgirl.mjs#eldest-daughter-track-five|65e3a600a0ce8adfb8510ce5c30d269060af81d9a73aa34d65b9adf5c1fad791;theories/the-life-of-a-showgirl.mjs#ophelia-video-self-references|7729e2282d1398ef887a02fca87c5bcf70c5f2aa2ea3b17f4d13e4ab683772bb
theories/the-life-of-a-showgirl.mjs#ts12-twelfth-album-twelve-tracks|f06ac5325f25b8aeba9eababc93cb230f551464082ea36f85e20529c907f86b5;theories/the-life-of-a-showgirl.mjs#showgirl-spotify-canvas-color-swap|2da72adcbcc257484fe5170ac83f4a00622cae552d50fb543023802dc1912cee;theories/the-life-of-a-showgirl.mjs#gracie-abrams-death-wish-not-about-taylor|3f6a2c37e085ae3eadd28292ce036ef9aaa37caab76397c2ffe58fd18d38d2f8
theories/the-life-of-a-showgirl.mjs#showgirl-esb-green-ts-debut-era|37e34a6ba395d8627a4d611b9232596aec6713c9c2b85cedc99f3f932ceae67d;theories/tortured-poets.mjs#thank-you-aimee-capitals|779b147c92e816a2ca85b02daaec972f663ebedc0b3e43cb3f2333611dadb03d;theories/tortured-poets.mjs#peter-pan-throughline|0ff81462c87b75fd612dab9a2dcf58295e15eab7b6f93dd170ec030aab05d935
theories/tortured-poets.mjs#fortnight-dead-poets-casting|3bd8c8e2ac5cd85925d52f8256b2d6ef442b7bcce6b13df47d63450f16991322;theories/tortured-poets.mjs#ttpd-spotify-library-eggs|adb27bf9179a8ed355a7b5274c797aab6244ca7c65979ba1f522e9c472be529e;theories/tortured-poets.mjs#black-dog-real-pub|468dcf49a8e443c805c2ed65a2642fc47e24a31fd73533877c45a6e43b44aec8
theories/tortured-poets.mjs#ttpd-grief-playlists|4db97da17877ca3c056ae3d0ff630ef22e8cd7161593a973a37def4459f3bc0f;theories/tortured-poets.mjs#clara-bow-it-girl-lineage|0d958555704790fd8119de191949392fd9bc9f88ffaade06f11ae06e27ee1713;theories/tortured-poets.mjs#cassandra-reputation-callback|74e91832594b72fe65f042270e3cc7ceca51a2c66c6c3e42f282840b757612c6
theories/tortured-poets.mjs#ttpd-quill-fountain-pen-era|0c21845aa273b55d3255337af180ec6225079225a19f93308fc9b73a80360f81;videos/1989.mjs#the-1989-world-tour-live-film|c47652979b2651c61675845ce70a9410f2379bbf23c66653b89de01a85a893af;videos/fearless.mjs#journey-to-fearless|e14395fd44335dfc04404f1d58a9a694b7f9d9d10a7964f1ffde5c57bb3b1351
videos/lover.mjs#miss-americana|0f6f768d1d01f43bd3516d79edf0063685b9abd269be2f26e15b53a99986951a;videos/lover.mjs#city-of-lover|47929398c653a9cc2e115be8bc851f3775328bc76982e288a6bb46c5c0bde858;videos/midnights.mjs#taylor-swift-the-eras-tour-film|3e075322490d6c1ae895c5c857844953e0097ad89d3e602dd93cebc669b9a484
videos/reputation.mjs#reputation-stadium-tour-film|b03e1b4bfc6060593dbecbc713e6191fd9505c78a88eabe59494fbf543a659a2;videos/speak-now.mjs#speak-now-world-tour-live|e46ceaba1803e11c6832b57c257a54466c7712855d0136d4f251ca45e195a60d;videos/the-life-of-a-showgirl.mjs#the-official-release-party-of-a-showgirl|04979498ee397995224ff976ea86443ec87fe9face8d1af91244ddfd2f51e057
social/inbox/appearance-2026-10-12-FqbcAAKQjes.json|132d0a779dfbec6d7c6a915bf668e184703bcaff20dacb2cc6d81484f92bfad6;merch/official.mjs#8238952612040|279a66866c48f8eb03e9b6456ac2c138c9c33a857f54ebd0ce5f0de8e2349fdd;merch/official.mjs#8239061434568|c303c84620551bd2857a625d9f6fb9527697a8fc08d0ff37f83084dadc25b1d2
`;

export const SURFACE_MEDIA_LEGACY = new Map(
  SURFACE_MEDIA_LEGACY_TEXT.trim().split(/[;\s]+/).map((entry) => entry.split('|')),
);

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const https = (value) => text(value) && value === value.trim() && /^https:\/\//i.test(value);
const placeholderImage = (value) => {
  if (!text(value)) return false;
  try {
    const pathname = new URL(value).pathname;
    return /^\/eras\//i.test(pathname) || /(?:^|[/_.-])placeholder(?:[/_.-]|$)/i.test(pathname);
  } catch {
    return true;
  }
};

const renderableMediaEntry = (media) => {
  if (!media || typeof media !== 'object') return false;
  if (media.kind === 'oembed') return https(media.post_url);
  if (media.kind === 'owned') return text(media.asset_path) && text(media.license_ref);
  if (media.kind === 'hotlink_legacy') return https(media.url) && !placeholderImage(media.url);
  return false;
};

/** Missing-media predicates for the non-moment surfaces P1-23 can gate
 * without changing their data models. */
export function nonMomentMediaErrors(row) {
  return Array.isArray(row?.media) && row.media.some(renderableMediaEntry)
    ? []
    : ['record needs renderable media (oEmbed, owned asset, or hotlink)'];
}

export function socialInboxMediaErrors(intent) {
  return Array.isArray(intent?.media) && intent.media.some(text)
    ? []
    : ['social inbox intent needs at least one media path'];
}

export function merchMediaErrors(row) {
  return https(row?.imageUrl) && !placeholderImage(row.imageUrl)
    ? []
    : ['merch row needs a non-placeholder https imageUrl'];
}

export function surfaceMediaPublicationVerdict(
  key,
  item,
  itemErrors,
  legacy = SURFACE_MEDIA_LEGACY,
) {
  const exactLegacy = legacy.get(key) === momentFingerprint(item);
  const legacyGap = itemErrors.length > 0 && exactLegacy;
  return { errors: legacyGap ? [] : itemErrors, legacyGap };
}

/** Returns errors for authored media that cannot render as a useful visual. */
export function momentMediaErrors(item) {
  const errors = [];
  const thumbnail = item?.thumbnailUrl;
  const photos = item?.moment?.photos;
  const video = item?.video ?? item?.moment?.video;
  const social = item?.socialPost ?? item?.moment?.socialPost;

  const validThumbnail = https(thumbnail) && !placeholderImage(thumbnail);
  const validPhotos = Array.isArray(photos)
    ? photos.filter((photo) => photo && https(photo.url) && !placeholderImage(photo.url))
    : [];
  const validVideo =
    video &&
    text(video.youtubeId) &&
    /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId) &&
    text(video.title);
  const validSocial =
    social &&
    social.platform === 'instagram' &&
    text(social.shortcode) &&
    /^[A-Za-z0-9_-]+$/.test(social.shortcode) &&
    text(social.label);

  if (thumbnail != null && !validThumbnail)
    errors.push('thumbnailUrl must be an authored https image, not blank or era fallback art');
  if (video != null && !validVideo)
    errors.push('video requires an 11-character YouTube id and non-empty title');
  if (social != null && !validSocial)
    errors.push('socialPost requires a valid Instagram shortcode and non-empty label');
  if (!validThumbnail && validPhotos.length === 0 && !validVideo && !validSocial)
    errors.push(
      'published moment needs an authored photo, thumbnail, YouTube video, or Instagram embed; empty arrays/objects and source links do not count',
    );
  return errors;
}

export const momentFingerprint = (item) =>
  createHash('sha256').update(JSON.stringify(item)).digest('hex');

export function mediaPublicationVerdict(key, item, legacy = MEDIA_LEGACY) {
  const errors = momentMediaErrors(item);
  const onlyMissing = errors.length === 1 && errors[0].startsWith('published moment needs');
  const exactLegacy = legacy.get(key) === momentFingerprint(item);
  return {
    errors: onlyMissing && exactLegacy ? [] : errors,
    legacyGap: onlyMissing && exactLegacy,
  };
}

export function mediaCorpusErrors(loaded, legacy = MEDIA_LEGACY) {
  const findings = [];
  const seen = new Set();
  const exactLegacyGaps = new Set();
  for (const { file, data } of loaded) {
    for (const [index, item] of (data?.items ?? []).entries()) {
      const key = `${file}#${item.slug ?? slugify(item.title)}`;
      seen.add(key);
      const verdict = mediaPublicationVerdict(key, item, legacy);
      if (verdict.legacyGap) exactLegacyGaps.add(key);
      for (const message of verdict.errors)
        findings.push({ file, index, title: item.title, message });
    }
  }
  for (const key of legacy.keys()) {
    if (!seen.has(key))
      findings.push({
        message: `MEDIA_LEGACY lists "${key}", which matches no moment — delete the entry`,
      });
    else if (!exactLegacyGaps.has(key))
      findings.push({
        message: `MEDIA_LEGACY lists "${key}", but it no longer matches the exact legacy snapshot — add media and delete the entry`,
      });
  }
  return findings;
}

export async function assertSeedMomentMedia(seedDir) {
  const contentDir = new URL('./content/', pathToFileURL(`${seedDir}/`));
  const loaded = [];
  for (const file of readdirSync(contentDir)
    .filter((name) => name.endsWith('.mjs') && !name.startsWith('_'))
    .sort()) {
    loaded.push({ file, data: (await import(new URL(file, contentDir))).default });
  }
  const findings = mediaCorpusErrors(loaded);
  if (findings.length) {
    const detail = findings
      .map(
        (finding) =>
          `${finding.file ?? 'legacy'}${finding.index == null ? '' : `[${finding.index}]`}: ${finding.message}`,
      )
      .join('\n');
    throw new Error(`content media publication gate failed:\n${detail}`);
  }
}
