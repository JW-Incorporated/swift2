// Slot registry types (One UI wave 0). No React/RN/Expo imports: the slot value
// is opaque here (a component in practice) so this file stays transport-neutral.

/** A route the native side owns for a slice (rendered in a native overlay, not in the DOM host). */
export type NativeRouteEntry = {
  /** Unique id, conventionally `<slice>:<name>`. */
  id: string;
  /** Exact web path (string) or a pattern tested against the web path. `g`/`y` regexes are rejected. */
  match: string | RegExp;
};

/**
 * Native-safe half of a slice: `dom/slots/<slice>.routes.ts` (no slot
 * components, so the native bundle can import it) calls `registerRoutes` with this.
 */
export type RouteModule = {
  /** Slice name; the registry keys idempotence on it. */
  slice: string;
  nativeRoutes: readonly NativeRouteEntry[];
};

/** DOM half of a slice: `dom/slots/<slice>.ts` calls `register` with this. */
export type SliceModule<C = unknown> = {
  /** Slice name; the registry keys idempotence on it. */
  slice: string;
  /** Slot name -> slot value. Names are unique across all slices. */
  slots: Readonly<Record<string, C>>;
};

export type SlotRegistry<C = unknown> = {
  /**
   * Adds a slice. Re-registering the same slice with identical slots is a no-op
   * (Fast Refresh); different content or a clashing slot name throws.
   */
  register: (mod: SliceModule<C>) => void;
  /** Merged slot map, a fresh copy. */
  slots: () => Record<string, C>;
};

export type RouteRegistry = {
  /** Same idempotence and fail-loud rules as `register`; also rejects conflicting matchers. */
  registerRoutes: (mod: RouteModule) => void;
  /** Frozen copies; callers cannot mutate the allow-list. */
  nativeRoutes: () => readonly Readonly<NativeRouteEntry>[];
  /** True when `path` is claimed by a registered native route. */
  isNativeRoute: (path: string) => boolean;
};
