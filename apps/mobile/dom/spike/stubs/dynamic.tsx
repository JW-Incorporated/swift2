import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from 'react';

type Loaded<P> = ComponentType<P> | { default: ComponentType<P> };

interface DynamicOptions {
  loading?: ComponentType<object> | (() => ReactNode);
  ssr?: boolean;
}

/** next/dynamic stand-in for the DOM bundle: React.lazy + Suspense; `ssr` is ignored. */
export default function dynamic<P extends object = object>(
  loader: () => Promise<Loaded<P>>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const loaded = await loader();
    return 'default' in loaded ? loaded : { default: loaded };
  });
  const Loading = options.loading;
  const fallback = Loading ? createElement(Loading as ComponentType<object>) : null;
  return function Dynamic(props: P) {
    return createElement(Suspense, { fallback }, createElement(Lazy as ComponentType<P>, props));
  };
}
