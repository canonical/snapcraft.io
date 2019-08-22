import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import debounce from "../../libs/debounce";

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

export default function TourOverlay({ target, onHideClick }) {
  // ignore elements that are not in DOM
  if (!document.contains(target)) {
    target = null;
  }

  const [targetEl, setTargetEl] = useState(target);
  const overlayEl = useRef(null);

  const mask = targetEl ? getMaskFromRect(getRectFromEl(targetEl)) : null;

  // rerender on resize
  // it is an unusual use of useState to force rerender, but on resize
  // the state of component doesn't change, it's the position of elements
  // in DOM that changes and component needs to rerender to adapt
  const [, forceUpdate] = useState();
  const rerender = () => forceUpdate({});

  useEffect(() => {
    const onResize = debounce(() => rerender(), 500);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  const onClick = event => {
    // we need to "click through" the overlay to check what is underneath it
    overlayEl.current.style.pointerEvents = "none";
    const targetEl = document.elementFromPoint(event.clientX, event.clientY);
    overlayEl.current.style.pointerEvents = "";

    setTargetEl(targetEl);
  };

  return (
    <div className="p-tour-overlay" ref={overlayEl} onClick={onClick}>
      <TourOverlayMask mask={mask} />
      <TourStepCard mask={mask} onHideClick={onHideClick} />
    </div>
  );
}

TourOverlay.propTypes = {
  target: PropTypes.instanceOf(Element),
  onHideClick: PropTypes.func
};
