import { Provider as JotaiProvider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import type { PrimitiveAtom } from "jotai";

import type { Store } from "../types/shared";

type InitialValues = Array<readonly [PrimitiveAtom<Store[]>, Store[]]>;

const HydrateAtoms = ({
  initialValues,
  children,
}: {
  initialValues: InitialValues;
  children: JSX.Element;
}) => {
  useHydrateAtoms(initialValues);
  return children;
};

const JotaiTestProvider = ({
  initialValues,
  children,
}: {
  initialValues: InitialValues;
  children: JSX.Element;
}) => (
  <JotaiProvider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </JotaiProvider>
);

export default JotaiTestProvider;
