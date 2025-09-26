import { useCallback } from "react";

export default function useMergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
  const mergedRefs = useCallback<React.RefCallback<T>>(
    (element) => {
      for (const ref of refs) {
        if (!ref) continue;

        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          (ref as React.RefObject<T | null>).current = element;
        }
      }
    },
    [...refs],
  );

  return mergedRefs;
}
