import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LEGAL_DOCS,
  LEGAL_DRAFT_BANNER,
  LEGAL_FACTS,
  LEGAL_LINKS,
  LEGAL_STATUS,
  PRIVACY_POLICY,
  TERMS_OF_USE,
  hasPlaceholder,
  legalEffectiveLine,
  legalPlaceholders,
  legalRobots,
  legalSitemapEntries,
  type LegalDoc,
} from './legal';

/**
 * #800 — the LEGAL launch gate. These tests protect the two properties that
 * make a legal page dangerous when they break:
 *
 *   1. An UNREVIEWED draft must never read as approved policy — so a draft
 *      carries the banner and is `noindex`, and an "approved" document may not
 *      contain a single unfilled blank.
 *   2. The pages must be REACHABLE — an unlinked privacy policy is the same as
 *      no privacy policy, which is the state this repo was actually in.
 */

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

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

describe('legal documents — draft safety', () => {
  it('ships both documents', () => {
    expect(LEGAL_DOCS.map((d) => d.slug)).toEqual(['privacy', 'terms']);
  });

  it('never lets an "approved" document ship with an unanswered [FOUNDERS:] blank', () => {
    // The whole point of the gate. If someone flips LEGAL_STATUS without
    // filling in the entity, jurisdiction, contact addresses, and effective
    // date, this fails loudly instead of publishing a policy full of holes.
    if (LEGAL_STATUS === 'approved') {
      expect(legalPlaceholders()).toEqual([]);
    } else {
      expect(legalPlaceholders().length).toBeGreaterThan(0);
    }
  });

  it('keeps drafts out of search results and out of the sitemap', () => {
    expect(legalRobots('draft')).toEqual({ index: false, follow: true });
    expect(legalRobots('approved')).toEqual({ index: true, follow: true });
    expect(legalSitemapEntries('draft')).toEqual([]);
    expect(legalSitemapEntries('approved').map((e) => e.url)).toEqual([
      'https://www.longlivets.com/privacy',
      'https://www.longlivets.com/terms',
    ]);
  });

  it('never claims an effective date while the blank is unfilled', () => {
    expect(hasPlaceholder(legalEffectiveLine('draft'))).toBe(false);
    expect(legalEffectiveLine('draft')).toMatch(/not yet in effect/i);
  });

  it('says in the banner that it is unreviewed and not in effect', () => {
    const banner = `${LEGAL_DRAFT_BANNER.title} ${LEGAL_DRAFT_BANNER.body}`.toLowerCase();
    expect(banner).toContain('draft');
    expect(banner).toContain('counsel');
    expect(banner).toContain('not legal advice');
  });

  it('leaves every fact a human must supply as a tracked blank, not a guess', () => {
    // Regression guard for the failure mode this whole ticket exists to avoid:
    // an agent inventing a company name, a governing law, or a contact address.
    for (const key of [
      'entity',
      'jurisdiction',
      'privacyEmail',
      'legalEmail',
      'postalAddress',
      'effectiveDate',
    ] as const) {
      expect(hasPlaceholder(LEGAL_FACTS[key]), `${key} must stay a [FOUNDERS:] blank`).toBe(true);
    }
  });
});

describe('legal documents — structure and a11y', () => {
  for (const doc of LEGAL_DOCS) {
    describe(doc.slug, () => {
      it('has a title, a description, a plain-language summary and sections', () => {
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.description.length).toBeGreaterThan(0);
        expect(doc.summary.length).toBeGreaterThan(0);
        expect(doc.sections.length).toBeGreaterThan(4);
      });

      it('gives every section a unique anchor id and a non-empty heading', () => {
        const ids = doc.sections.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const section of doc.sections) {
          expect(section.id).toMatch(/^[a-z][a-z0-9-]*$/);
          expect(section.heading.trim().length).toBeGreaterThan(0);
          expect(section.blocks.length).toBeGreaterThan(0);
        }
      });

      it('gives every table a caption, a header row, and rows of matching width', () => {
        for (const section of doc.sections) {
          for (const block of section.blocks) {
            if (block.kind !== 'table') continue;
            expect(block.caption.trim().length).toBeGreaterThan(0);
            expect(block.head.length).toBeGreaterThan(1);
            for (const row of block.rows) expect(row.length).toBe(block.head.length);
          }
        }
      });

      it('has no empty prose', () => {
        for (const text of allStrings(doc)) expect(text.trim()).not.toBe('');
      });
    });
  }
});

describe('privacy policy — must describe what the code actually does', () => {
  const corpus = allStrings(PRIVACY_POLICY).join('\n').toLowerCase();

  // Every entry here is a real data flow verified in the shipped code on
  // 2026-08-11. If one of these disappears from the policy, either the feature
  // was removed (fine — delete the line here too) or the policy went stale in
  // exactly the way it went stale before.
  it.each([
    ['the feedback button', 'feedback'],
    ['the mood chat', 'mood'],
    ['the analytics vendor', 'vercel'],
    ['the AI service that reads mood text', 'anthropic'],
    ['where feedback is stored', 'github'],
    ['the content database', 'supabase'],
    ['embedded video', 'youtube'],
    ['embedded audio', 'spotify'],
    ['embedded social posts', 'instagram'],
    ['on-device storage', 'local storage'],
    ['the user-agent string it sends', 'user-agent'],
    ['IP handling', 'ip address'],
    ['children', 'children'],
  ])('discloses %s', (_label, needle) => {
    expect(corpus).toContain(needle);
  });

  it('does not repeat the retired page’s false "we collect nothing" claim', () => {
    // The July 2026 policy said "the Vault does not collect personal data",
    // "no analytics", and "What we collect: Nothing" — all three were untrue by
    // the time anyone read them.
    expect(corpus).not.toContain('we collect nothing');
    expect(corpus).not.toContain('no analytics');
    expect(corpus).not.toContain('does not collect personal data');
  });

  it('states the unaffiliated-fan-project position', () => {
    expect(corpus).toContain('not affiliated with');
  });
});

describe('terms of use — the IP and fair-use surface (#800 scope)', () => {
  const corpus = allStrings(TERMS_OF_USE).join('\n').toLowerCase();

  it.each([
    ['the unaffiliated-fan-site disclaimer', 'not affiliated with'],
    ['the trademark position', 'trademark'],
    ['the image-credit position', 'credit'],
    ['the fair-use position', 'fair'],
    ['a takedown path', 'takedown'],
    ['the no-full-lyrics position', 'lyric'],
    ['acceptable use', 'scrape'],
    ['that the mood chat is not advice', 'crisis'],
    ['governing law', 'governed by the laws'],
    ['the liability disclaimer', 'as is'],
  ])('covers %s', (_label, needle) => {
    expect(corpus).toContain(needle);
  });
});

describe('reachability — an unlinked policy is no policy', () => {
  it('exposes exactly the two footer links, pointing at the two routes', () => {
    expect(LEGAL_LINKS).toEqual([
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Use' },
    ]);
  });

  it('renders those links from the site footer', () => {
    const footer = read('../../components/longlive/SiteFooter.tsx');
    expect(footer).toContain('LEGAL_LINKS');
    expect(footer).toContain('aria-label="Legal"');
  });

  it('has a route file behind every footer link', () => {
    for (const link of LEGAL_LINKS) {
      expect(() => read(`../../app${link.href}/page.tsx`)).not.toThrow();
    }
  });

  it('wires each route to its document and to the draft robots rule', () => {
    const privacy = read('../../app/privacy/page.tsx');
    expect(privacy).toContain('PRIVACY_POLICY');
    expect(privacy).toContain('robots: legalRobots()');

    const terms = read('../../app/terms/page.tsx');
    expect(terms).toContain('TERMS_OF_USE');
    expect(terms).toContain('robots: legalRobots()');
  });
});
