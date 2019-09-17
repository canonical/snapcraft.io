import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";

export const DND_ITEM_CHANNEL = "DND_ITEM_CHANNEL";
export const DND_ITEM_REVISIONS = "DND_ITEM_REVISIONS";

export const Handle = () => (
  <span className="p-drag-handle">
    <i className="p-icon--drag" />
  </span>
);

// it's a wrapper around react-dnd useDrag hook
// with some added functionality and workaround for a bug
export const useDragging = options => {
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

  const [{ isDragging }, drag, preview] = useDrag({
    item: options.item,
    canDrag: () => options.canDrag || true,
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    }),

    begin: () => {
      setIsGrabbing(true);
    },
    end: () => {
      if (isRendered) {
        setIsGrabbing(false);
      }
    }
  });

  return [isDragging, isGrabbing, drag, preview];
};

// we don't need to add much common functionality to useDrag hook
// so we just export it as it is
export { useDrop };
