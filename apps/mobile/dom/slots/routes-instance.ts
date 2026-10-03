// Native-safe singleton route registry. `<slice>.routes.ts` files import `registerRoutes` from here.
import { createRouteRegistry } from './routes-registry';

let current = createRouteRegistry();

export const registerRoutes: ReturnType<typeof createRouteRegistry>['registerRoutes'] = (m) => current.registerRoutes(m);
export const nativeRoutes: ReturnType<typeof createRouteRegistry>['nativeRoutes'] = () => current.nativeRoutes();
export const isNativeRoute: ReturnType<typeof createRouteRegistry>['isNativeRoute'] = (p) => current.isNativeRoute(p);

/** Test only. */
export function resetRoutesForTests(): void {
  current = createRouteRegistry();
}
