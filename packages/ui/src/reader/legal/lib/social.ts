// Site → social footer links (#736). IG/TikTok/X only, per the growth
// playbook (`docs/marketing/growth-plan.md` §0/§1): footer icon links yes,
// embedded feeds no, no Facebook or Reddit link. Every href carries UTM tags
// so channel attribution shows which direction the traffic flowed.
export type SocialLink = {
  id: 'instagram' | 'tiktok' | 'x';
  label: string;
  href: string;
};

const UTM = 'utm_source=site&utm_medium=footer';

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: `https://www.instagram.com/longlivetscom?${UTM}`,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: `https://www.tiktok.com/@longlivetscom?${UTM}`,
  },
  {
    id: 'x',
    label: 'X',
    href: `https://x.com/longlivetscom?${UTM}`,
  },
];
