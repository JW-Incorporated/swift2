import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LegalDocument } from '@swift2/ui/reader/legal/LegalDocument';
import { SupportPage } from '@swift2/ui/reader/legal/SupportPage';
import { PRIVACY_POLICY } from './legal';
import { TestHostProvider } from '@/lib/test-host';

const read = (name: string) =>
  readFileSync(
    new URL(`../../../../packages/ui/src/reader/legal/${name}`, import.meta.url),
    'utf8',
  );

describe('legal renderers stay server components', () => {
  it.each(['LegalDocument.tsx', 'SupportPage.tsx'])('%s has no client directive', (file) => {
    const src = read(file);
    expect(src).not.toMatch(/^\s*['"]use client['"]/m);
    expect(src).not.toMatch(/host\/context/);
    const local = [...src.matchAll(/from '(\.\/[^']+)'/g)].map((m) => m[1]);
    expect(local.filter((p) => p !== './lib/legal')).toEqual(['./HostLink']);
  });

  it('HostLink is the client leaf and legal.ts is not imported by it', () => {
    const src = read('HostLink.tsx');
    expect(src).toMatch(/^'use client'/);
    expect(src).not.toMatch(/lib\/legal/);
  });
});

describe('legal renderers markup', () => {
  it('LegalDocument renders breadcrumb, headings, sections and the footer slot last', () => {
    const html = renderToStaticMarkup(
      <TestHostProvider>
        <LegalDocument doc={PRIVACY_POLICY} footer={<footer id="slot">F</footer>} />
      </TestHostProvider>,
    );
    expect(html).toMatch(/<a [^>]*href="[/]"/);
    expect(html).toContain(`<h1`);
    expect(html).toContain(PRIVACY_POLICY.title);
    for (const s of PRIVACY_POLICY.sections) expect(html).toContain(`id="${s.id}"`);
    expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('id="slot"'));
    expect(html.endsWith('</footer></div>')).toBe(true);
  });

  it('SupportPage renders anchors, mailto links and the footer slot', () => {
    const html = renderToStaticMarkup(
      <TestHostProvider>
        <SupportPage footer={<footer id="slot">F</footer>} />
      </TestHostProvider>,
    );
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="mailto:');
    expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('id="slot"'));
  });
});
