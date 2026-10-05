import { LEGAL_FACTS } from './legal-types';
import type { LegalDoc } from './legal-types';

// ───────────────────────────────────────────────────────────────────────────
// Terms of use
// ───────────────────────────────────────────────────────────────────────────

export const TERMS_OF_USE: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Use',
  description:
    'The terms for using Long Live, an unofficial Taylor Swift fan project — including our rights position and how to send a takedown notice.',
  summary:
    "Long Live is a free, unofficial fan project. It is not Taylor Swift's site and has nothing to do with her or her team. Use it, enjoy it, do not scrape or misuse it, and if you own something we have published and want it taken down, there is an address below that reaches a human.",
  sections: [
    {
      id: 'unaffiliated',
      heading: 'This is a fan site, not an official one',
      blocks: [
        {
          kind: 'p',
          text: `${LEGAL_FACTS.siteName} is an independent, unofficial, non-commercial fan project created by people who like the music. It is not affiliated with, endorsed by, sponsored by, licensed by, or connected to Taylor Swift, Taylor Nation, her management, her record labels, her publishers, her tour promoters, or any of her business partners. Nothing on this site is an official statement, and no part of it should be read as speaking for her.`,
        },
        {
          kind: 'p',
          text: '"Taylor Swift", the album and tour names, and the associated logos and marks belong to their respective owners. We use them only to refer to the works and events we are writing about — the ordinary way any publication names its subject — and not as branding of our own.',
        },
      ],
    },
    {
      id: 'acceptance',
      heading: 'Accepting these terms',
      blocks: [
        {
          kind: 'p',
          text: `By using ${LEGAL_FACTS.siteUrl} you agree to these terms. If you do not agree, please do not use the site. There is nothing to sign up for and nothing to cancel — you can stop at any time by closing the page.`,
        },
        {
          kind: 'p',
          text: 'Your privacy is covered separately, in our Privacy Policy, which forms part of these terms.',
        },
      ],
    },
    {
      id: 'editorial',
      heading: 'What the content is, and what it is not',
      blocks: [
        {
          kind: 'p',
          text: 'Everything written here is fan commentary, history, and analysis, assembled from published reporting and from what Taylor and her team have said publicly. We write in our own words and cite our sources.',
        },
        {
          kind: 'p',
          text: "We label how confident we are. Anything presented as a fan theory, an Easter-egg reading, a rumour, or an unconfirmed report is exactly that, and is marked as such on the page — it is one reading of the evidence, not a statement of fact, and not a claim about anyone's private life. Where a claim rests on someone else's reporting, we name who reported it and when.",
        },
        {
          kind: 'p',
          text: 'We may be wrong. Dates, details, and interpretations can be mistaken or become out of date, and the site is provided as reference and entertainment, not as an authoritative record. If you spot an error, the feedback button on any page reaches us.',
        },
      ],
    },
    {
      id: 'our-content',
      heading: 'Our own writing',
      blocks: [
        {
          kind: 'p',
          text: 'The original text, structure, design, and code of this site belong to the project. You are welcome to read it, quote a reasonable extract with credit and a link, and share links to it. Please do not copy the site wholesale, republish substantial parts of it as your own, or use automated tools to scrape it in bulk.',
        },
      ],
    },
    {
      id: 'third-party-material',
      heading: 'Photographs, music, and other third-party material',
      blocks: [
        {
          kind: 'p',
          text: 'Photographs, album art, video, and song lyrics quoted on this site are the property of their respective owners — photographers, agencies, labels, publishers, and the artist. We claim no ownership of any of it.',
        },
        {
          kind: 'p',
          text: 'Our position on how it is used here:',
        },
        {
          kind: 'list',
          items: [
            'We credit the source of a photograph wherever the credit is known to us, and many images are loaded directly from the site that published them rather than copied.',
            "Music and official videos play through the rights-holders' own embedded players — Spotify and YouTube — so playback happens on their terms, and we host no audio or video ourselves.",
            'We do not reproduce full song lyrics. Songs are discussed in our own words, quoting at most a line or two to illustrate a point, the way music journalism does.',
            'We do not publish AI-generated images presented as real photographs. Where a stand-in or comparable image is used to illustrate something, it is labelled as one.',
            'The site is a non-commercial work of fan commentary and criticism. We believe this use is fair, but fair use is a defence decided case by case, not a licence — so if you own something here and disagree, tell us and we will act rather than argue.',
          ],
        },
      ],
    },
    {
      id: 'takedown',
      heading: 'Copyright and takedown requests',
      blocks: [
        {
          kind: 'p',
          text: `If you own or represent the owner of material published here and you want it removed, write to ${LEGAL_FACTS.legalEmail}. We take these seriously and we would rather remove something quickly than debate it.`,
        },
        {
          kind: 'p',
          text: 'To let us act fast, please include:',
        },
        {
          kind: 'list',
          items: [
            'The exact address (URL) of the page, and enough description to identify which image or passage you mean.',
            'A description of the work you say is infringed, and your relationship to it.',
            'Your name and contact details.',
            'A statement that you believe in good faith that the use is not authorised by the owner, its agent, or the law.',
            'A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the owner or authorised to act for the owner.',
            'Your physical or electronic signature.',
          ],
        },
        {
          kind: 'p',
          text: 'We will remove or disable access to properly identified material promptly. If you believe your material was removed by mistake, write to the same address and say why.',
        },
        {
          // Founder call 2026-08-24 (Joey): register a DMCA agent. Filing
          // itself needs Joey's own Copyright Office account/payment — see
          // HUMAN-ACTIONS.md. Update this line to say "is registered" once
          // that filing is actually complete — do not claim it early.
          kind: 'p',
          text: 'We are in the process of registering a designated DMCA agent with the U.S. Copyright Office to receive these notices.',
        },
        {
          kind: 'p',
          text: `Notices about trademarks, publicity rights, or anything else you believe is wrong on the site go to the same address: ${LEGAL_FACTS.legalEmail}.`,
        },
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Using the site responsibly',
      blocks: [
        {
          kind: 'p',
          text: 'There is no account to lose, so this is short. Please do not:',
        },
        {
          kind: 'list',
          items: [
            'Scrape, crawl, or bulk-download the site beyond what a normal reader does, or try to get around our rate limits.',
            "Use the feedback box, the mood chat, or Clownbot to send abusive, threatening, unlawful, or deliberately misleading messages, to send other people's personal information, or to try to make our systems misbehave.",
            'Attempt to break into, disrupt, or probe the site or the services behind it.',
            "Republish the site's content as your own, or present anything from it as an official statement by Taylor Swift or her team.",
          ],
        },
        {
          kind: 'p',
          text: 'Anything you send us through the feedback box, you give us permission to use to fix and improve the site. Please do not send anything confidential, and please do not send anything you do not have the right to send.',
        },
      ],
    },
    {
      id: 'mood-not-advice',
      heading: 'The mood chat is a song recommender, not support',
      blocks: [
        {
          kind: 'p',
          text: 'The mood feature exists to pick songs. It is not counselling, therapy, medical or mental-health advice, or a crisis service, and it must not be relied on as any of those. If you are struggling or in danger, please contact your local emergency number or a crisis line — the feature will show you resources rather than songs if it recognises a message of that kind, but it can miss, and it is not a substitute for a person.',
        },
      ],
    },
    {
      id: 'external-links',
      heading: 'Links to other sites',
      blocks: [
        {
          kind: 'p',
          text: 'We link out to news articles, official posts, and other sources, and we embed players from Spotify and YouTube. We do not control those sites and are not responsible for their content, their availability, or their handling of your data. Their terms and privacy policies apply once you are there.',
        },
      ],
    },
    {
      id: 'availability',
      heading: 'Availability and changes',
      blocks: [
        {
          kind: 'p',
          text: 'The site is free and provided as-is. We may change, suspend, or discontinue any part of it — including the feedback button and the mood chat — at any time and without notice. We may update these terms; the effective date at the top of the page tells you when the current version took effect, and continuing to use the site after a change means you accept it.',
        },
      ],
    },
    {
      id: 'disclaimer',
      heading: 'Disclaimer and limitation of liability',
      blocks: [
        {
          kind: 'p',
          text: 'To the fullest extent the law allows, the site is provided "as is" and "as available", without warranties of any kind, express or implied, including any warranty of accuracy, merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the site will be uninterrupted, error-free, or free of harmful components.',
        },
        {
          kind: 'p',
          text: 'To the fullest extent the law allows, we are not liable for any indirect, incidental, special, consequential, or exemplary damages arising from your use of the site. Nothing in these terms excludes any liability that cannot lawfully be excluded, and some jurisdictions do not allow some of these exclusions, in which case they apply to you only as far as the law permits.',
        },
      ],
    },
    {
      id: 'governing-law',
      heading: 'Governing law',
      blocks: [
        {
          kind: 'p',
          text: `These terms are governed by the laws of ${LEGAL_FACTS.jurisdiction}, and the courts there have exclusive jurisdiction over any dispute, without regard to conflict-of-law rules. If any provision of these terms is held unenforceable, the rest remains in force.`,
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        {
          kind: 'p',
          text: `Takedown and legal notices: ${LEGAL_FACTS.legalEmail}. Privacy questions and data requests: ${LEGAL_FACTS.privacyEmail}. Postal notices: ${LEGAL_FACTS.postalAddress}. Everything else — corrections, bugs, "you got this wrong" — is best sent through the feedback button on any page, which reaches us fastest.`,
        },
        {
          kind: 'p',
          text: `${LEGAL_FACTS.siteName} is operated by ${LEGAL_FACTS.entity}.`,
        },
      ],
    },
  ],
};
