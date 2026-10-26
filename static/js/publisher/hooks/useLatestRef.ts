import { useRef } from "react";
import type { RefObject } from "react";

// Lets a memoized closure (e.g. a Field's `validate`) read the latest value.
export default function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}
