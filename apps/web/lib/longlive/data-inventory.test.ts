import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRIVACY_POLICY, type LegalDoc } from './legal';
import {
  DATA_INVENTORY,
  appStorePrivacyRows,
  generatedMobilePrivacyBlock,
  playDataSafetyParagraph,
} from './data-inventory';
import { withRegeneratedBlock, DOC_FILE } from '../../../../scripts/generate-mobile-privacy-doc.mjs';

/**
 * OS-042 — one source of truth for the privacy factual sections and the
 * mobile data-safety doc. `docs/specs/2026-09-05-one-source-three-surfaces.md`
 * §6: "Done when: a test fails if the inventory and the policy disagree."
 */

function allStrings(doc: LegalDoc): string[] {
  const out = [doc.title, doc.description, doc.summary];
  for (const section of doc.sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      if (block.kind === 'p') out.push(block.text);
      else if (block.kind === 'list') out.push(...block.items);
      else out.push(block.caption, ...block.head, ...block.rows.flat());
    }
  }
  return out;
}

const privacyCorpus = allStrings(PRIVACY_POLICY).join('\n').toLowerCase();

describe('data inventory — agrees with the /privacy policy', () => {
  it('discloses every collected item\'s policyNeedle somewhere in the policy prose', () => {
    for (const item of DATA_INVENTORY.filter((i) => i.collected)) {
      expect(privacyCorpus, `"${item.id}" (${item.policyNeedle}) must be disclosed in PRIVACY_POLICY`).toContain(
        item.policyNeedle,
      );
    }
  });

  it('has no empty needles or labels', () => {
    for (const item of DATA_INVENTORY) {
      expect(item.policyNeedle.trim().length).toBeGreaterThan(0);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = DATA_INVENTORY.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('data inventory — drives the mobile data-safety doc', () => {
  it('produces a non-empty App Store rows table with the collection question first', () => {
    const rows = appStorePrivacyRows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0][0]).toContain('collect data from this app');
  });

  it('produces a Google Play paragraph mentioning the declared data type', () => {
    const para = playDataSafetyParagraph();
    expect(para).toContain('Device or other IDs');
    expect(para).toContain('privacy@longlivets.com');
  });

  it('the generated block mentions every collected item\'s App Store category', () => {
    const block = generatedMobilePrivacyBlock();
    for (const item of DATA_INVENTORY.filter((i) => i.collected)) {
      expect(block).toContain(item.appStore.category);
    }
  });

  it('the committed mobile doc\'s GENERATED block is in sync with the inventory', () => {
    // The actual drift guard: regenerating from the CURRENT inventory must
    // produce byte-identical output to what is committed. If someone edits
    // DATA_INVENTORY (or hand-edits the doc) without running
    // `npm run privacy:mobile-doc`, this fails — same idiom as
    // check-affiliate-coverage-in-sync.mjs / check-generated-in-sync.mjs.
    const path = new URL('../../../../' + DOC_FILE, import.meta.url);
    const committed = readFileSync(path, 'utf8');
    const regenerated = withRegeneratedBlock(committed);
    expect(regenerated).toBe(committed);
  });
});
