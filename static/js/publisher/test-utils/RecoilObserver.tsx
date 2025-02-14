import { useEffect } from "react";
import { RecoilState, useRecoilValue } from "recoil";

import type { EventFunction } from "../types/shared";

const RecoilObserver = <T,>({
  node,
  event,
}: {
  node: RecoilState<T>;
  event: EventFunction<T>;
}) => {
  const value = useRecoilValue(node);

  useEffect(() => {
    event(value);
  }, [event, value]);

  return null;
};

export default RecoilObserver;
