// Tidewatch D5 / P2-05: the Baby Watch toggle and inbox rendering ship inert. Read at build time
// (Next inlines NEXT_PUBLIC_*), default OFF; flipped only at P2-13's staged go-live.
export const babyWatchUiEnabled = (): boolean => process.env.NEXT_PUBLIC_BABY_WATCH_ENABLED === 'true';
