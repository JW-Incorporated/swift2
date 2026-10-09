import { PERSONAS, type PersonaSlug } from '@swift2/experience';
import { HostLink } from './HostLink';

/**
 * Persona byline for a detail-view header (copy-desk spec §8): the persona's
 * mark plus "By <name>", linking to that persona's card on the meet-the-desk
 * page. Detail views and dossier headers only; feeds stay clean.
 */
export function Byline({ author, className = '' }: { author?: PersonaSlug; className?: string }) {
  if (!author) return null;
  const persona = PERSONAS[author];
  return (
    <HostLink
      href={`/desk#${persona.slug}`}
      data-testid="byline"
      aria-label={`By ${persona.name}, one of our editorial characters. Meet the desk.`}
      className={`inline-flex items-center gap-2 text-sm text-[color:var(--era-ink-soft)] hover:text-[color:var(--era-ink)] ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-xs font-semibold text-[color:var(--era-bg)]"
      >
        {persona.mark}
      </span>
      <span>
        By <span className="font-medium text-[color:var(--era-ink)]">{persona.name}</span>
      </span>
    </HostLink>
  );
}
