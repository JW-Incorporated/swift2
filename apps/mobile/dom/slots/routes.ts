// NATIVE-SAFE entry: the native host's route map imports `isNativeRoute` from
// here. Adding a slice's native routes = create `dom/slots/<slice>.routes.ts`
// (imports `registerRoutes` from './routes-instance'; NO slot components) and
// add ONE side-effect import line below. `slots.test.ts` asserts this module's
// import graph contains no DOM slot file.

// --- slice route imports go here, one line each ---

export { isNativeRoute, nativeRoutes, registerRoutes } from './routes-instance';
export type { NativeRouteEntry, RouteModule } from './types';
