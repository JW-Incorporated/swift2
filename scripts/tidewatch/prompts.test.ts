import { describe, expect, it } from 'vitest';
import { FALLBACK_SYSTEM } from './cascade.mjs';
import { CLASS_BY_OPTION, CLASS_OPTIONS, questionsFor } from './questions.mjs';

const classQuestion = questionsFor('news').find((q: { id: string }) => q.id === 'q_class') as { instructions: string; options: { id: string }[] };

describe('Tidewatch D-c prompt text', () => {
  for (const [name, text] of [['Q_CLASS', () => classQuestion.instructions], ['FALLBACK_SYSTEM', () => FALLBACK_SYSTEM]] as const) {
    it(`${name} carries the D-c key phrases`, () => {
      const t = text().toLowerCase();
      for (const phrase of ['tracklist', 'new planned tour', 'premiere', 'pre-order']) expect(t).toContain(phrase);
    });
  }

  it('Q_CLASS and FALLBACK_SYSTEM carry the D-c addendum phrases', () => {
    for (const t of [classQuestion.instructions.toLowerCase(), FALLBACK_SYSTEM.toLowerCase()]) {
      for (const phrase of ['concert film', 'livestream', 'festival']) expect(t).toContain(phrase);
    }
  });

  it('FALLBACK_SYSTEM covers the required negative exemplars', () => {
    expect(FALLBACK_SYSTEM).toMatch(/VMA stage" => normal_news/);
    expect(FALLBACK_SYSTEM).toMatch(/premiere set for Tuesday" => normal_news/);
    expect(FALLBACK_SYSTEM).toMatch(/Pre-orders open[^"]*" => official_drop/);
    expect(FALLBACK_SYSTEM).toMatch(/fans speculate" => rumor/);
    expect(FALLBACK_SYSTEM).toMatch(/no confirmation from her team" => rumor/);
  });

  it('q_speculation exempts official announcements', () => {
    const q = questionsFor('news').find((x: { id: string }) => x.id === 'q_speculation') as { instructions: string };
    expect(q.instructions).toContain('not speculation');
  });

  it('privacy wording is narrowed with negatives and the presale line is present', () => {
    const q = questionsFor('news').find((x: { id: string }) => x.id === 'q_speculation') as { instructions: string };
    expect(q.instructions).toContain('UNCONFIRMED claims or speculation about her private life');
    expect(q.instructions).toContain('A correction, retraction or debunk of such a claim is not speculation.');
    expect(FALLBACK_SYSTEM).not.toContain('always wins');
    expect(FALLBACK_SYSTEM).toContain('Stories revealing her home address or tracking her whereabouts');
    expect(FALLBACK_SYSTEM).not.toContain('Home/property/location stories');
    for (const phrase of ['Not privacy_redline:', 'public appearance with her partner at a game or event (normal_news)',
      'concert or tour city news (tour_ticket/normal_news)', 'outfit or merch items (merch_*)',
      'a correction debunking a rumor (correction_debunk)']) expect(FALLBACK_SYSTEM).toContain(phrase);
    expect(FALLBACK_SYSTEM).toContain('presale or added dates for newly added shows is critical_breaking');
    expect(classQuestion.instructions).toContain('presale or added dates for newly added shows is critical_work_news');
    expect(classQuestion.instructions).toContain('ticket logistics for existing shows is tour_or_ticket_update');
  });

  it('Q_CLASS does not claim rumor covers privacy_redline', () => {
    expect(classQuestion.instructions).not.toContain('covers privacy_redline');
    expect(classQuestion.instructions).toContain('privacy_redline is not an option here');
  });

  it('option ids and class map are unchanged', () => {
    const ids = [
      'critical_work_news', 'personal_life_milestone', 'official_video_or_music_drop', 'tour_or_ticket_update',
      'general_news', 'official_merch', 'fan_made_merch', 'identifiable_outfit', 'easter_egg_or_theory',
      'fan_discussion', 'rumor_or_unconfirmed', 'correction_or_debunk', 'off_topic_noise',
    ];
    expect(CLASS_OPTIONS.map((o: { id: string }) => o.id)).toEqual(ids);
    expect(classQuestion.options.map((o) => o.id)).toEqual(ids);
    expect(CLASS_BY_OPTION).toEqual({
      critical_work_news: 'critical_breaking',
      personal_life_milestone: 'critical_personal',
      official_video_or_music_drop: 'official_drop',
      tour_or_ticket_update: 'tour_ticket',
      general_news: 'normal_news',
      official_merch: 'merch_official',
      fan_made_merch: 'merch_fan',
      identifiable_outfit: 'merch_outfit',
      easter_egg_or_theory: 'theory_material',
      fan_discussion: 'fan_discussion',
      rumor_or_unconfirmed: 'rumor',
      correction_or_debunk: 'correction_debunk',
      off_topic_noise: 'noise',
    });
  });
});
