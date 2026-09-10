import { describe, expect, it } from 'vitest';
import { isoDate, issueTitle, issueBody } from './knowledge-fb-export-reminder.mjs';

describe('isoDate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-08-23T16:00:00Z'))).toBe('2026-08-23');
  });
});

describe('issueTitle', () => {
  it('is date-scoped, one issue per week', () => {
    expect(issueTitle('2026-08-23')).toBe('FB group export due — week of 2026-08-23');
  });
});

describe('issueBody', () => {
  it('flags a missing checklist rather than silently listing nothing', () => {
    const body = issueBody([]);
    expect(body).toMatch(/No groups configured yet/);
    expect(body).toMatch(/fb-groups-checklist\.mjs/);
    expect(body).toMatch(/HUMAN-ACTIONS\.md #16/);
  });

  it('lists every configured group as a checklist item', () => {
    const body = issueBody([
      { slug: 'group-a', label: 'Group A' },
      { slug: 'group-b', label: 'Group B' },
    ]);
    expect(body).toContain('- [ ] Group A (`group-a`)');
    expect(body).toContain('- [ ] Group B (`group-b`)');
  });

  it('flags candidate rows with a confirm-or-delete note and the flip instructions', () => {
    const body = issueBody([
      { slug: 'group-a', label: 'Group A', candidate: true },
      { slug: 'group-b', label: 'Group B' },
    ]);
    expect(body).toContain(
      "- [ ] Group A (`group-a`) — _candidate, confirm you're a member, or delete the line_",
    );
    expect(body).toContain('- [ ] Group B (`group-b`)');
    expect(body).not.toContain('Group B (`group-b`) — _candidate');
    expect(body).toMatch(/remove.*`candidate: true`/);
    expect(body).toMatch(/confirmed <slug>/);
  });

  it('omits the flip instructions when no rows are candidates', () => {
    const body = issueBody([{ slug: 'group-a', label: 'Group A' }]);
    expect(body).not.toMatch(/confirmed <slug>/);
  });

  it('mentions the owner and references the upload command', () => {
    const body = issueBody([]);
    expect(body).toMatch(/@sffan15-sys/);
    expect(body).toMatch(/npm run knowledge:fb-upload/);
  });

  it('names the private drop location (facebook-exports bucket, never the repo)', () => {
    const body = issueBody([]);
    expect(body).toMatch(/private `facebook-exports` Supabase Storage bucket/);
    expect(body).toMatch(/never the public repo/);
  });

  it('includes the fb-export-ingest step referencing card P1-3', () => {
    const body = issueBody([]);
    expect(body).toMatch(/node scripts\/community\/fb-export-ingest\.mjs --group/);
    expect(body).toMatch(/--dry-run/);
    expect(body).toMatch(/P1-3/);
  });

  it('includes the first-real-export calibration checklist referencing HUMAN-ACTIONS.md #16', () => {
    const body = issueBody([]);
    expect(body).toMatch(/one-time calibration \(HUMAN-ACTIONS\.md #16\)/);
    expect(body).toMatch(/0 posts kept on a group you know was active/);
    expect(body).toMatch(/parser is calibrated/);
  });
});
