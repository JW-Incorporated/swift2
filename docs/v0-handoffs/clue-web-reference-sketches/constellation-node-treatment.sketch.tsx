// SKETCH ONLY — from v0's very first reply (message 2 of 26), before any repo
// mount was attempted. Illustrates the core idea "X axis = time" plus
// size-by-significance / color-by-era / dim-don't-delete filtering. The final
// constellation.tsx (time-axis map with era bands, one lane per motif, a
// desktop 2D layout AND a separate purpose-built mobile vertical time-stream,
// always-on payoff labels, first-run overlay) was built later and is
// substantially more developed than this fragment — its final source was
// never captured in the export. See docs/clue-web-thread-handoff.md.
//
// Legend + node treatment sketch (positions come from time-on-X layout)
<g>
  {nodes.map((n) => (
    <g key={n.id} transform={`translate(${xForYear(n.year)}, ${n.y})`}
       className="cursor-pointer" onClick={() => selectNode(n.id)}>
      {n.isPayoff && (
        <circle r={n.r + 6} fill="var(--era-accent)" opacity={0.18} /> // glow
      )}
      <circle r={n.r} fill="var(--era-accent)"
        opacity={activeMotif && n.motif !== activeMotif ? 0.15 : 1} />
      {(n.isPayoff || n.id === hoverId) && (
        <text x={n.r + 6} y={4} fontSize={12}
          fill="var(--era-ink)" style={{ fontFamily: 'var(--era-font)' }}>
          {n.label}
        </text>
      )}
    </g>
  ))}
</g>
