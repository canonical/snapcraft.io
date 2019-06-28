import { useState, useEffect } from "react";
import { useDrag } from "react-dnd";

export const DND_ITEM_REVISION = "DND_ITEM_REVISION";
export const DND_ITEM_CHANNEL = "DND_ITEM_CHANNEL";

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
