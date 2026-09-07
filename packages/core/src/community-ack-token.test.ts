import { describe, expect, it } from 'vitest';
import { signAckToken, verifyAckToken } from './community-ack-token';

const SECRET = 'test-secret-do-not-use-in-prod';
const LEAD_ID = '11111111-1111-4111-8111-111111111111';

describe('signAckToken / verifyAckToken', () => {
  it('a token verifies against the exact payload it was signed for', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    expect(
      verifyAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false }, token),
    ).toBe(true);
  });

  it('is deterministic — signing the same payload twice yields the same token', () => {
    const a = signAckToken(SECRET, { leadId: LEAD_ID, action: 'skip', linkIncluded: false });
    const b = signAckToken(SECRET, { leadId: LEAD_ID, action: 'skip', linkIncluded: false });
    expect(a).toBe(b);
  });

  it('rejects a token minted for a different action on the same lead (tamper case)', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'skip', linkIncluded: false });
    expect(
      verifyAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false }, token),
    ).toBe(false);
  });

  it('rejects a token minted for a different lead id (tamper case)', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    const otherLead = '22222222-2222-4222-8222-222222222222';
    expect(
      verifyAckToken(SECRET, { leadId: otherLead, action: 'posted', linkIncluded: false }, token),
    ).toBe(false);
  });

  it('rejects a token whose linkIncluded flag was flipped — a copied "posted" URL cannot dodge or inflate the redditNonPromo counter by editing ?link=', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: true });
    expect(
      verifyAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false }, token),
    ).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    expect(
      verifyAckToken(
        'a-different-secret',
        { leadId: LEAD_ID, action: 'posted', linkIncluded: false },
        token,
      ),
    ).toBe(false);
  });

  it('rejects garbage/malformed hex without throwing', () => {
    expect(
      verifyAckToken(
        SECRET,
        { leadId: LEAD_ID, action: 'posted', linkIncluded: false },
        'not-hex-at-all!!',
      ),
    ).toBe(false);
    expect(verifyAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false }, '')).toBe(
      false,
    );
  });

  it('rejects a token of the wrong length (e.g. truncated)', () => {
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    expect(
      verifyAckToken(
        SECRET,
        { leadId: LEAD_ID, action: 'posted', linkIncluded: false },
        token.slice(0, 10),
      ),
    ).toBe(false);
  });
});
