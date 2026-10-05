'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { EGG_NODES } from '@swift2/experience';
import { getEra } from '@swift2/experience';
import type { EggNode } from '@swift2/experience';

export function ClueWebNodes({
  active,
  muted,
  onToggle,
  onHover,
}: {
  active: string | null;
  muted: (id: string) => boolean;
  onToggle: (id: string) => void;
  onHover: (id: string) => void;
}) {
  const refs = useRef(new Map<string, SVGGElement>());
  const [current, setCurrent] = useState<string | null>(null);
  const tabStop = current ?? active ?? EGG_NODES[0]?.id;
  const move = (index: number) => {
    const target = EGG_NODES[(index + EGG_NODES.length) % EGG_NODES.length];
    if (!target) return;
    setCurrent(target.id);
    refs.current.get(target.id)?.focus();
  };
  return (
    <>
      {EGG_NODES.map((n, i) => (
        <ClueWebNode
          key={n.id}
          node={n}
          isActive={active === n.id}
          muted={muted(n.id)}
          tabStop={tabStop === n.id}
          nodeRef={(el) => {
            if (el) refs.current.set(n.id, el);
            else refs.current.delete(n.id);
          }}
          onToggle={() => onToggle(n.id)}
          onHover={() => {
            setCurrent(n.id);
            onHover(n.id);
          }}
          onNavigate={(key) => {
            if (key === 'Home') move(0);
            else if (key === 'End') move(EGG_NODES.length - 1);
            else if (key === 'ArrowRight' || key === 'ArrowDown') move(i + 1);
            else move(i - 1);
          }}
        />
      ))}
    </>
  );
}

export function ClueWebNode({
  node: n,
  isActive,
  muted,
  tabStop = true,
  nodeRef,
  onToggle,
  onHover,
  onNavigate,
}: {
  node: EggNode;
  isActive: boolean;
  muted: boolean;
  tabStop?: boolean;
  nodeRef?: (el: SVGGElement | null) => void;
  onToggle: () => void;
  onHover: () => void;
  onNavigate?: (key: string) => void;
}) {
  const era = getEra(n.eraId);
  const isTheory = n.confirmed === false;
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    } else if (onNavigate && ['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      onNavigate(event.key);
    }
  };
  return (
    <g
      transform={`translate(${n.x} ${n.y * 0.5625})`}
      role="button"
      ref={nodeRef}
      tabIndex={tabStop ? 0 : -1}
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
