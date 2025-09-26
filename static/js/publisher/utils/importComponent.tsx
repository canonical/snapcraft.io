import { forwardRef, lazy, Suspense } from "react";
import { Spinner } from "@canonical/react-components";

type LoaderFn<TComponent extends React.ComponentType> = () => Promise<{
  default: TComponent;
}>;

/**
 * Helper function that uses `React.lazy` to load a component and wrap it in a `React.Suspense` boundary
 *
 * @param {LoaderFn<TComponent>} loader function that executes the lazy import for `Component`
 * @param {React.ReactNode} fallback element that will be displayed while waiting for `Component` to load, optional
 * @return a `Suspense` boundary that wraps `Component`
 */
export function importComponent<TComponent extends React.ComponentType>(
  loader: LoaderFn<TComponent>,
  fallback?: React.ReactNode
) {
  const Component = lazy(loader);

  return forwardRef<unknown, React.ComponentPropsWithRef<TComponent>>(
    (props, ref) => (
      <Suspense fallback={fallback ? fallback : <Spinner text="Loading..." />}>
        {/*
          Something is wrong with the types for Component and its props,
          but it does actually work at runtime and types are inferred properly
          outisde of this file, so...
        */}
        {/* @ts-expect-error: let's just ignore this error for the moment */}
        <Component {...props} ref={ref} />
      </Suspense>
    )
  );
}
