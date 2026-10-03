// Slot registry types (One UI wave 0). No React/RN/Expo imports: the slot value
// is opaque here (a component in practice) so this file stays transport-neutral.

/** A route the native side owns for a slice (rendered in a native overlay, not in the DOM host). */
export type NativeRouteEntry = {
  /** Unique id, conventionally `<slice>:<name>`. */
  id: string;
  /** Exact web path (string) or a pattern tested against the web path. */
  match: string | RegExp;
};

/** What one `dom/slots/<slice>.ts` file exports as its default: its slots AND its native routes. */
export type SliceModule<C = unknown> = {
  /** Slice name; must equal the file name. */
  slice: string;
  /** Slot name -> slot value. Names are unique across all slices. */
  slots: Readonly<Record<string, C>>;
  nativeRoutes?: readonly NativeRouteEntry[];
};

export type SlotRegistry<C = unknown> = {
  /** Adds a slice. Throws on a duplicate slice, slot name or native route id (a wiring bug, fail loud). */
  register: (mod: SliceModule<C>) => void;
  /** Merged slot map, ready to hand to the reader root. */
  slots: () => Record<string, C>;
  nativeRoutes: () => readonly NativeRouteEntry[];
  /** True when `path` is claimed by a registered native route. */
  isNativeRoute: (path: string) => boolean;
};
