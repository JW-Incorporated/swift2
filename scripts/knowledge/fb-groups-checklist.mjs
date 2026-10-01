// The Facebook groups checklist for the weekly export reminder (proposal
// §4.7, PLAN.md Stage 6). Add entries as:
//
//   { slug: 'example-group-slug', label: 'Example Group Name', groupId: '123', candidate: true }
//
// `slug` becomes the saved filename prefix (`fb-<slug>-<date>.html`) and the
// `fan_signal.community` value (`facebook:<slug>`) once parsed — keep it
// short, lowercase, hyphenated, stable (renaming a slug here orphans any
// history keyed on the old one).
//
// `candidate: true` means the group was found via desk research (sources.md
// § "Sources mined -- Facebook Groups research") but nobody has confirmed
// Joey is actually a member — the weekly reminder issue flags these rows so
// he can confirm membership or delete the line before the first real export.
// Drop `candidate` (or set it `false`) once membership is confirmed.
export const FB_ACTING_PAGE = {
  name: 'Long Live',
};

// Which profile reads the groups. 'personal' (Joey's own profile) since the
// 2026-09-30 live run: these groups do not allow Pages ("This group doesn't
// allow Pages to join") and the Vault is invisible to the Long Live Page, so
// the Page cannot read them. 'page' switches into FB_ACTING_PAGE instead.
export const FB_READ_AS = 'personal';

export const FB_GROUPS_CHECKLIST = [
  {
    slug: 'taylor-swifts-vault',
    label: "Taylor Swift's Vault",
    groupId: '2254218764714763',
    wallBudgetMs: 75 * 60_000,
    candidate: true,
  },
  {
    slug: 'friendship-bracelet-making-trading',
    label: 'Friendship Bracelet Making and Trading',
    groupId: '959997728506267',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  {
    slug: 'swiftie-super-worldwide-bracelet-trade',
    label: 'Swiftie Super Worldwide Friendship Bracelet Trade',
    groupId: '1404884973507150',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  {
    slug: 'kulto-ni-taylor-swift',
    label: 'Kulto ni TAYLOR SWIFT',
    groupId: '557483725146375',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  {
    slug: 'taylor-swifts-vault-2-0',
    label: "Taylor Swift's Vault 2.0",
    groupId: 'taylorswiftsvault2',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  // TODO(owner): name — one of "Otro Grupo De Taylor Swift…" / "Taylor Swift fans club"
  {
    slug: 'taylor-swift-group-563881396975983',
    label: 'Taylor Swift group 563881396975983',
    groupId: '563881396975983',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  // TODO(owner): name — one of "Otro Grupo De Taylor Swift…" / "Taylor Swift fans club"
  {
    slug: 'taylor-swift-group-458298915485042',
    label: 'Taylor Swift group 458298915485042',
    groupId: '458298915485042',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  // pending approval as of 2026-09-30 — not-member until approved
  {
    slug: 'taylor-swift-swifties',
    label: 'Taylor Swift- swifties',
    groupId: '344186002656221',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  {
    slug: 'taylor-swift-swifties-2',
    label: 'Taylor Swift (Swifties)',
    groupId: '1002433896451360',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  {
    slug: 'the-swifties-society',
    label: "The Swiftie's Society",
    groupId: '308196990150746',
    wallBudgetMs: 20 * 60_000,
    candidate: true,
  },
  // Removed 2026-09-30: 'taylor-swift-swifties' (264466934870157) and
  // 'friendship-bracelets-buy-sell-trade' (1220925938596348) — desk-research IDs
  // that resolve to "This content isn't available" for every profile (Joey confirmed).
];
