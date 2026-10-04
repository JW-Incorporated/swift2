'use client';

import { CheckCircle2, HelpCircle, Clock, Layers } from 'lucide-react';

export function StatBar({
  total,
  confirmed,
  theories,
  longestGap,
  shown,
}: {
  total: number;
  confirmed: number;
  theories: number;
  longestGap: number;
  shown: number;
}) {
  const stats = [
    { icon: <Layers size={11} />, value: shown === total ? total : `${shown}/${total}`, label: shown === total ? 'clues' : 'showing' },
    { icon: <CheckCircle2 size={11} />, value: confirmed, label: 'confirmed' },
    { icon: <HelpCircle size={11} />, value: theories, label: 'theories' },
    { icon: <Clock size={11} />, value: `${longestGap}yr`, label: 'longest gap' },
  ];

  return (
    <div className="mt-4 flex items-center divide-x overflow-hidden rounded-lg border text-xs" style={{ background: 'var(--era-surface)', borderColor: 'var(--era-line)' }}>
      {stats.map((s, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-0.5 px-1 py-2" style={{ borderColor: 'var(--era-line)' }}>
          <div className="flex items-center gap-1" style={{ color: 'var(--era-accent)' }}>
            {s.icon}
            <span className="font-mono font-bold leading-none">{s.value}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--era-ink-soft)' }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
