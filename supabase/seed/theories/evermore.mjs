// Vault theories/easter eggs — evermore era. All URLs verified 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'evermore',
  theories: [
    {
      slug: 'thirteen-backwards',
      kind: 'easter_egg',
      title: 'Dropped when 13 runs backwards',
      claim:
        'evermore arrived two days before her 31st birthday — and she said the timing was the point: she\'d been excited about turning 31 "because it\'s my lucky number backwards, which is why I wanted to surprise you with this now."',
      evidence:
        'Stated in her own announcement of the album: the 31/13 mirror was her framing, not a fan read. The numerology habit that started with hand-painted 13s now sets release dates.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:lucky-number-13', 'folklore:woodvale'],
      sources: [wiki('Evermore_(Taylor_Swift_album)', 'Evermore (Taylor Swift album)', 'her 31/13 announcement framing is documented in the album article')],
    },
  ],
};
