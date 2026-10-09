// Display data for the four persona authors (spec §2). Slugs are permanent
// identifiers (routing.ts); names, marks and copy here can change freely.
import type { PersonaSlug } from './routing';

export interface Persona {
  slug: PersonaSlug;
  name: string;
  /** Single-character mark used as the avatar. */
  mark: string;
  mnemonic: string;
  beat: string;
  bio: string;
}

export const PERSONAS: Record<PersonaSlug, Persona> = {
  theo: {
    slug: 'theo',
    name: 'Theo',
    mark: 'T',
    mnemonic: 'theory',
    beat: 'Music, releases, videos and track dossiers',
    bio: 'The music-theory and lyrics nerd. Talks keys, bridges and production credits, with five-albums-ago callbacks. Precise, and a little breathless about a good key change.',
  },
  loren: {
    slug: 'loren',
    name: 'Loren',
    mark: 'L',
    mnemonic: 'lore',
    beat: 'Theories and easter eggs',
    bio: 'The easter-egg hunter. Fluent in clown, numerology and timestamp forensics. Playful, self-aware (we have been wrong before), and never states a theory as fact.',
  },
  vera: {
    slug: 'vera',
    name: 'Vera',
    mark: 'V',
    mnemonic: 'couture',
    beat: 'Fashion and sightings',
    bio: 'The red-carpet and street-style historian. Names the designer from a blurry photo and ties the outfit to its era. Visual, decisive, warm.',
  },
  deb: {
    slug: 'deb',
    name: 'Deb',
    mark: 'D',
    mnemonic: 'debut-era OG',
    beat: 'Relationships, business, tours, tour films and documentaries',
    bio: 'A fan since MySpace and the timeline historian. Keeps the receipts on the masters, the relationships and the tours. Dry, exact, and protective of getting the dates right.',
  },
};

export const PERSONA_LIST: Persona[] = [PERSONAS.theo, PERSONAS.loren, PERSONAS.vera, PERSONAS.deb];

/** Disclosure framing approved by the founders 2026-07-12 (issue #478, option A). */
export const DESK_DISCLOSURE =
  'Theo, Loren, Vera and Deb are our editorial characters: voices our team writes through, not disguised real people. Every entry is still researched, sourced and checked by the humans and tools behind Long Live.';
