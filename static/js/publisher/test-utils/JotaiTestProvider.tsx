import { Provider as JotaiProvider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

// Using any to make it work with all atom types - this will be type-safe at usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InitialValues = Array<readonly [any, any]>;

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
