'use client';

import type { KeyboardEvent } from 'react';
import { getEra } from '@swift2/experience';
import type { EggNode } from '@swift2/experience';

export function ClueWebNode({
  node: n,
  isActive,
  muted,
  onToggle,
  onHover,
}: {
  node: EggNode;
  isActive: boolean;
  muted: boolean;
  onToggle: () => void;
  onHover: () => void;
}) {
  const era = getEra(n.eraId);
  const isTheory = n.confirmed === false;
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };
  return (
    <g
      transform={`translate(${n.x} ${n.y * 0.5625})`}
      role="button"
      tabIndex={0}
      aria-label={n.label}
      aria-pressed={isActive}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      onFocus={onHover}
      onMouseEnter={onHover}
      className="cursor-pointer focus-visible:outline-none [&:focus-visible>circle:first-of-type]:stroke-[color:var(--era-ink)] [&:focus-visible>circle:first-of-type]:[stroke-width:1]"
      style={{ opacity: muted ? 0.28 : 1, transition: 'opacity 200ms' }}
    >
      <circle
        r={isActive ? 2.6 : n.kind === 'payoff' ? 2 : 1.5}
        fill={n.kind === 'payoff' ? era.theme.accent : 'var(--era-bg)'}
        stroke={era.theme.accent}
        strokeWidth={0.4}
        strokeDasharray={isTheory ? '0.8 0.6' : undefined}
      />
      {n.kind === 'clue' && !isTheory && <circle r={0.6} fill={era.theme.accent} />}
    </g>
  );
}
