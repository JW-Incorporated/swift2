import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module
import { parseListingHtml, parseThreadHtml } from './parsers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(path.join(here, 'fixtures', name), 'utf8');

describe('home Reddit fixture parsers', () => {
  it('parses lead score, comment count, creation time, and age', () => {
    const posts = parseListingHtml(fixture('listing.html'), {
      now: new Date('2026-10-15T18:00:00.000Z'),
    });
    expect(posts[0]).toMatchObject({
      id: 'fixture01',
      score: 1200,
      numComments: 47,
      createdAt: '2026-10-15T12:00:00.000Z',
      ageHours: 6,
    });
    expect(posts[1].permalink).not.toContain('utm_source');
  });

  it('parses a post body transiently and a depth-bearing comment tree', () => {
    const thread = parseThreadHtml(fixture('thread.html'));
    expect(thread.body).toContain('sanitized post body');
    expect(thread.comments).toHaveLength(2);
    expect(thread.comments.map((comment: { depth: number }) => comment.depth)).toEqual([0, 1]);
    expect(thread.comments.every((comment: { author: null }) => comment.author === null)).toBe(
      true,
    );
  });

  it('parses the server-rendered classic page used by the live reader', () => {
    const html = fixture('classic-thread.html');
    expect(parseListingHtml(html, { now: new Date('2026-10-15T18:00:00.000Z') })[0]).toMatchObject({
      id: 'classic01',
      score: 456,
      numComments: 12,
      ageHours: 8,
    });
    const thread = parseThreadHtml(html);
    expect(thread.comments.map((comment: { depth: number }) => comment.depth)).toEqual([0, 1]);
  });
});
