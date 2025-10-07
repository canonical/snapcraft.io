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
        } else if (Object.hasOwn(ref, "current")) {
          (ref as React.RefObject<T | null>).current = element;
        } else {
          console.error(
            `useMergeRefs: can't merge object "${JSON.stringify(ref) || ref?.toString()}" because it's not a ref`,
          );
        }
      }
    },
    [...refs],
  );

  return mergedRefs;
}
