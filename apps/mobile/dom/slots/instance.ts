import { createSlotRegistry } from './registry';

let current = createSlotRegistry();

/** The app-wide DOM slot registry. Slice files import `register` from here and call it at module scope. */
export const register: ReturnType<typeof createSlotRegistry>['register'] = (m) => current.register(m);
export const slots: ReturnType<typeof createSlotRegistry>['slots'] = () => current.slots();

/** Test only. */
export function resetSlotsForTests(): void {
  current = createSlotRegistry();
}
