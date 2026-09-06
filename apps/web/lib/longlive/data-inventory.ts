/**
 * Data inventory — OS-042, `docs/specs/2026-09-05-one-source-three-surfaces.md`
 * §6 (Phase 4). One list of what Long Live collects, used to keep two
 * documents from disagreeing the way they have before (#800, #3251):
 *
 *   1. `/privacy` (`apps/web/lib/longlive/legal.ts`, `PRIVACY_POLICY`) — the
 *      hand-authored, counsel-facing prose. It stays hand-authored; legal
 *      copy is not template output. This file does not generate it.
 *   2. `apps/mobile/docs/privacy-and-data-safety.md` — the App Store /
 *      Google Play paste-ready answers. The generated block between the
 *      `<!-- GENERATED -->` markers in that file IS produced from this
 *      list — see `scripts/generate-mobile-privacy-doc.mjs`.
 *
 * The single source of truth is the list of `DataInventoryItem`s below, each
 * carrying a `policyNeedle`: a lowercase substring that MUST appear
 * somewhere in the `/privacy` prose. `data-inventory.test.ts` fails if:
 *   - a needle is missing from `PRIVACY_POLICY` (the store form claims a
 *     collection the policy never discloses), or
 *   - the mobile doc's generated block no longer matches what this list
 *     would produce (someone hand-edited the paste-ready answers without
 *     updating the inventory, or vice versa).
 *
 * Adding or removing a collected data type: add/remove the item here first,
 * regenerate the mobile doc (`npm run privacy:mobile-doc`), then update the
 * `/privacy` prose to disclose it in the same change — same standing rule
 * `legal.ts` already carries.
 */

export type AppStoreCategory =
  | 'Identifiers → Device ID'
  | 'Identifiers → User ID'
  | 'User Content → Other User Content'
  | 'Usage Data → Product Interaction';

export type AppStorePurpose = 'App Functionality' | 'Analytics';

export type DataInventoryItem = {
  /** Stable id, also used as the React/test key. */
  id: string;
  /** Human label for the data type. */
  label: string;
  /** Whether this data type is actually collected today. */
  collected: boolean;
  /** Lowercase substring that must appear in the `/privacy` policy prose. */
  policyNeedle: string;
  /** App Store Connect → App Privacy mapping. */
  appStore: {
    category: AppStoreCategory;
    /** The paste-ready detail text for the App Store table's Answer column. */
    detail: string;
    purpose: AppStorePurpose;
    linked: boolean;
    tracking: boolean;
  };
};

/**
 * Verified 2026-09-05 against the shipped code (see `legal.ts`'s own source
 * inventory comment for the file list). Every `collected: true` item here
 * must have a matching disclosure in `PRIVACY_POLICY`.
 */
export const DATA_INVENTORY: DataInventoryItem[] = [
  {
    id: 'device-id',
    label: "The app's device UUID and Expo push token",
    collected: true,
    policyNeedle: 'device id',
    appStore: {
      category: 'Identifiers → Device ID',
      detail: "the app's UUID + push token",
      purpose: 'App Functionality',
      linked: false,
      tracking: false,
    },
  },
  {
    id: 'clownbot-session-id',
    label: "The website's anonymous Clownbot session id (cookie), read inside the in-app WebView",
    collected: true,
    policyNeedle: 'clownbot',
    appStore: {
      category: 'Identifiers → User ID',
      detail:
        "the website's anonymous Clownbot session id (cookie), because the app shows the site (2026-09-05 WebView decision)",
      purpose: 'App Functionality',
      linked: false,
      tracking: false,
    },
  },
  {
    id: 'user-content',
    label: 'Feedback-box text and mood-chat / Clownbot text typed inside the in-app site',
    collected: true,
    policyNeedle: 'feedback',
    appStore: {
      category: 'User Content → Other User Content',
      detail: 'feedback-box text (to GitHub) and mood-chat / Clownbot text (to the Claude API) typed inside the in-app site',
      purpose: 'App Functionality',
      linked: false,
      tracking: false,
    },
  },
  {
    id: 'product-interaction',
    label: 'Vercel Web Analytics page views inside the in-app site',
    collected: true,
    policyNeedle: 'vercel',
    appStore: {
      category: 'Usage Data → Product Interaction',
      detail: 'Vercel Web Analytics page views inside the in-app site',
      purpose: 'Analytics',
      linked: false,
      tracking: false,
    },
  },
];

/** The App Store nutrition-label result the inventory above produces. */
export const APP_STORE_RESULT_LABEL = '"Data Not Linked to You: Identifiers, User Content, Usage Data"';

/** Google Play "Data safety" facts — kept alongside the App Store inventory since they describe the same device id. */
export const PLAY_DATA_SAFETY = {
  collectsData: true,
  dataType: 'Device or other IDs',
  shared: false,
  ephemeral: false,
  required: true,
  requiredReason: 'needed for notifications to work',
  purpose: 'App functionality',
  encryptedInTransit: true,
  deletionRequestSupported: true,
  deletionEmail: 'privacy@longlivets.com',
} as const;

function linkedTrackingText(linked: boolean, tracking: boolean): string {
  return `${linked ? 'Linked' : 'Not linked'}, ${tracking ? 'tracking' : 'not tracking'}`;
}

/**
 * The App Store Connect → App Privacy paste-ready table, as markdown rows
 * (each `[Question, Answer]`). Mirrors the hand-verified table this replaced
 * in `apps/mobile/docs/privacy-and-data-safety.md`.
 */
export function appStorePrivacyRows(): [string, string][] {
  const anyCollected = DATA_INVENTORY.some((i) => i.collected);
  const rows: [string, string][] = [
    ['Do you or your third-party partners collect data from this app?', anyCollected ? '**Yes**' : '**No**'],
  ];
  for (const item of DATA_INVENTORY.filter((i) => i.collected)) {
    rows.push([
      `**${item.appStore.category}**`,
      `${item.appStore.detail}. Purpose: ${item.appStore.purpose}. ${linkedTrackingText(item.appStore.linked, item.appStore.tracking)}.`,
    ]);
  }
  rows.push(['Every other data type', '**not collected**']);
  rows.push(['Resulting label', `**${APP_STORE_RESULT_LABEL}**`]);
  return rows;
}

/** The Google Play "Data safety" paste-ready paragraph. */
export function playDataSafetyParagraph(): string {
  const p = PLAY_DATA_SAFETY;
  return (
    `**Google Play → Data safety** (paste-ready): Collects data: **${p.collectsData ? 'Yes' : 'No'}**. Data type:\n` +
    `**${p.dataType}**. Collected, ${p.shared ? 'shared' : 'not shared'}. ${p.ephemeral ? 'Processed ephemerally' : 'Not processed ephemerally'}.\n` +
    `${p.required ? 'Required' : 'Optional'} (${p.requiredReason}). Purpose: **${p.purpose}**.\n` +
    `Encrypted in transit: **${p.encryptedInTransit ? 'Yes' : 'No'}**. Deletion request: **${p.deletionRequestSupported ? 'Yes' : 'No'}** — email\n` +
    `${p.deletionEmail} (documented at /support and /privacy).`
  );
}

/**
 * The full generated block installed between the `<!-- GENERATED -->`
 * markers in `apps/mobile/docs/privacy-and-data-safety.md`. Kept as its own
 * function (not inlined in the generator script) so the test and the
 * generator read from exactly the same source.
 */
export function generatedMobilePrivacyBlock(): string {
  const tableHead = '| Question | Answer |\n| --- | --- |';
  const tableRows = appStorePrivacyRows()
    .map(([q, a]) => `| ${q} | ${a} |`)
    .join('\n');
  return (
    '**App Store Connect → App Privacy** (paste-ready):\n' +
    '\n' +
    `${tableHead}\n${tableRows}\n` +
    '\n' +
    `${playDataSafetyParagraph()}`
  );
}
