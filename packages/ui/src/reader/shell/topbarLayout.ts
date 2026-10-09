// Gaps and padding are rem-scaled but CAPPED at their 100%-text pixel value
// (`min(…rem, …px)`), never floored: at large text scale they stop growing so
// the chip and the actions keep their room (#5328, #5329). `@container` makes
// the row the query container for the rem-based container queries below it
// (container-query rem tracks the root font-size, unlike media-query rem).
export const TOPBAR_ROW_CLASS =
  'flex @container items-center justify-between gap-[min(0.5rem,8px)] border-b border-line bg-bg/80 px-[min(1rem,16px)] py-3 backdrop-blur-xl md:gap-[min(0.75rem,12px)] md:px-[min(1.5rem,24px)]';

export const TOPBAR_LEFT_CLASS =
  'flex min-w-0 items-center gap-[min(0.5rem,8px)] md:gap-[min(0.75rem,12px)]';

export const TOPBAR_ACTIONS_CLASS = 'flex shrink-0 items-center gap-[min(0.5rem,8px)]';
