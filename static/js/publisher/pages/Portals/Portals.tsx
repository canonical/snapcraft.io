import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type PortalName = "aside" | "modal" | "notification";
type PortalMap = Partial<Record<PortalName, HTMLElement>>;

const portalsState = atom<PortalMap>({});
const portalElementState = atomFamily((portalName: PortalName) => {
  return atom((get) => get(portalsState)[portalName]);
});

/**
 * Returns a ref to be assigned to an element that will serve as a portal render target;
 * the portal can be used by rendering inside a `<PortalEntrance name={name} />`
 */
function usePortalExit(name: PortalName) {
  const setPortals = useSetAtom(portalsState);

  const handlePortalRef = useCallback((node: HTMLElement | null) => {
    setPortals((portals) => ({
      ...portals,
      [name]: node,
    }));
  }, []);

  useEffect(() => {
    // cleanup function removes the reference to the portal exit element on unmount
    return () => {
      setPortals((portals) => ({
        ...portals,
        [name]: undefined,
      }));
    };
  }, []);

  return handlePortalRef;
}

function PortalEntrance({
  name,
  children,
}: {
  name: PortalName;
  children?: React.ReactNode;
}) {
  const portalElement = useAtomValue(portalElementState(name));

  return (
    <>{children && portalElement && createPortal(children, portalElement)}</>
  );
}

export { PortalEntrance, usePortalExit };
