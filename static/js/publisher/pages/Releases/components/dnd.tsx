import { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { ConnectDragPreview, ConnectDragSource } from "react-dnd";
import { DraggedItem } from "./releasesTable/types";

export const DND_ITEM_REVISIONS = "DND_ITEM_REVISIONS";

export const Handle = () => (
  <span className="p-drag-handle u-hide--small">
    <i className="p-icon--drag" />
  </span>
);

type Collected = {
  isDragging: boolean;
};

// it's a wrapper around react-dnd useDrag hook
// with some added functionality and workaround for a bug
export const useDragging = ({
  item,
  canDrag,
}: {
  item: DraggedItem | undefined;
  canDrag: boolean;
}): [
  boolean,
  boolean,
  ConnectDragSource | null,
  ConnectDragPreview | null,
] => {
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Calling useDrag end callback after history is closed (because promoting revisions closes history panel)
  // history panel is automatically closed after promoting revision
  // this causes an issue with dragging revision history item, because it's
  // unmounted at the time the `end` callback is being called.
  // This is likely an issue with react-dnd, hopefully to be fixed at some point:
  // https://github.com/react-dnd/react-dnd/issues/1435
  //
  // This isRendered effect is an attempt to workaround that:
  let isRendered = true;
  useEffect(() => {
    isRendered = true;
    return () => {
      isRendered = false;
    };
  });

  // @ts-ignore
  const [collected, drag, preview] = useDrag({
    item: item ?? { type: "" },
    type: item?.type ?? "",
    canDrag: () => canDrag && !!item,
    collect: (monitor): Collected => ({
      isDragging: !!monitor.isDragging(),
    }),

    // @ts-ignore
    beginDrag: () => {
      setIsGrabbing(true);
    },
    end: () => {
      if (isRendered) {
        setIsGrabbing(false);
      }
    },
  });

  // early return because the item is not defined and thus can't be dragged
  if (!item) {
    return [false, false, null, null];
  }

  const isDragging = (collected as Collected).isDragging;
  return [isDragging, isGrabbing, drag, preview];
};

// we don't need to add much common functionality to useDrag hook
// so we just export it as it is
export { useDrop };
