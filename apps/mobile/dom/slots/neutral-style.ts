import type { CSSProperties } from 'react';
import { ERA_CSS_VAR_NAMES, ERA_TOKENS } from '@swift2/experience';

// The web /settings/notifications page sits outside the era shell, so it shows the default :root palette
// (tokens.generated.css) and no accent foreground. Re-declare exactly that here so the overlay matches the web
// page instead of taking the reader's active era colors.
export const NEUTRAL = {
  background: ERA_TOKENS.bg,
  color: ERA_TOKENS.ink,
  '--era-accent-fg': 'initial',
  ...Object.fromEntries(
    (Object.keys(ERA_CSS_VAR_NAMES) as (keyof typeof ERA_TOKENS)[]).map((k) => [ERA_CSS_VAR_NAMES[k], ERA_TOKENS[k]]),
  ),
} as CSSProperties;
