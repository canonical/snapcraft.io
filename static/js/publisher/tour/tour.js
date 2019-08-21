import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

import TourStepCard from "./tourStepCard";
import TourOverlayMask from "./tourOverlayMask";

export const MASK_OFFSET = 5;

// get rectangle of given DOM element
// relative to the page, taking scroll into account
const getRectFromEl = el => {
  let clientRect = el.getBoundingClientRect();
  return {
    top:
      clientRect.top +
      (window.pageYOffset || document.documentElement.scrollTop),
    left:
      clientRect.left +
      (window.pageXOffset || document.documentElement.scrollLeft),
    width: clientRect.width,
    height: clientRect.height
  };
};

// get mask based on rectangle
const getMaskFromRect = rect => {
  let top = rect.top - MASK_OFFSET;
  if (top < 0) {
    top = 0;
  }

  let left = rect.left - MASK_OFFSET;
  if (left < 0) {
    left = 0;
  }

  let bottom = rect.top + rect.height + MASK_OFFSET;
  let right = rect.left + rect.width + MASK_OFFSET;

  return {
    top,
    bottom,
    left,
    right
  };
};

export default function Tour({ targetEl }) {
  const [rect, setRect] = useState(targetEl ? getRectFromEl(targetEl) : null);
  const overlayEl = useRef(null);

  const mask = rect ? getMaskFromRect(rect) : null;

  const onClick = event => {
    // we need to "click through" the overlay to check what is underneath it
    overlayEl.current.style.pointerEvents = "none";
    const elementMouseIsOver = document.elementFromPoint(
      event.clientX,
      event.clientY
    );
    overlayEl.current.style.pointerEvents = "";

    setRect(getRectFromEl(elementMouseIsOver));
  };

  return (
    <div className="p-tour-overlay" ref={overlayEl} onClick={onClick}>
      <TourOverlayMask mask={mask} />

      <TourStepCard mask={mask} />
    </div>
  );
}

Tour.propTypes = {
  targetEl: PropTypes.instanceOf(Element)
};
