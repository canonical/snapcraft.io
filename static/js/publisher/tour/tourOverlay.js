import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import debounce from "../../libs/debounce";

import TourStepCard from "./tourStepCard";
import TourOverlayMask from "./tourOverlayMask";

const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
const MASK_OFFSET = REM / 2; // .5rem  is a default spacing unit in Vanilla

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

// find DOM element for each step, ignore steps with no element
// set default position to "bottom-left"
function prepareSteps(steps) {
  return steps
    .map(step => {
      return {
        ...step,
        el: document.querySelector(`[data-tour="${step.id}"]`),
        position: step.position || "bottom-left"
      };
    })
    .filter(step => step.el);
}

export default function TourOverlay({ steps, onHideClick }) {
  steps = prepareSteps(steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = steps[currentStepIndex];

  // when current step changes, scroll step element into view
  useEffect(
    () => {
      step.el.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [currentStepIndex]
  );
  const overlayEl = useRef(null);

  const mask = getMaskFromRect(getRectFromEl(step.el));

  // rerender on resize or scroll
  // it is an unusual use of useState to force rerender, but on resize or scroll
  // the state of component doesn't change, it's the position of elements
  // in DOM that changes and component needs to rerender to adapt
  const [, forceUpdate] = useState();
  const rerender = () => forceUpdate({});

  const [isResizing, setIsResizing] = useState(false);

  // rerender after scroll (to adjust to fixed elements that might have moved)
  useEffect(() => {
    const afterScroll = debounce(() => rerender(), 500);
    window.addEventListener("scroll", afterScroll);
    return () => {
      window.removeEventListener("scroll", afterScroll);
    };
  });

  // rerender after resize (to adjust to new positions of elements)
  // and hide mask during resize to avoid misalign of mask and tooltip
  useEffect(() => {
    const onResize = () => {
      setIsResizing(true);
    };
    const afterResize = debounce(() => {
      setIsResizing(false);
      rerender();
    }, 1000);

    window.addEventListener("resize", onResize);
    window.addEventListener("resize", afterResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", afterResize);
    };
  });

  const onNextClick = () =>
    setCurrentStepIndex((currentStepIndex + 1) % steps.length);
  const onPrevClick = () =>
    setCurrentStepIndex((currentStepIndex - 1) % steps.length);

  return (
    <div className="p-tour-overlay" ref={overlayEl}>
      <TourOverlayMask mask={isResizing ? null : mask} />
      <TourStepCard
        steps={steps}
        currentStepIndex={currentStepIndex}
        mask={mask}
        onHideClick={onHideClick}
        onNextClick={onNextClick}
        onPrevClick={onPrevClick}
      />
    </div>
  );
}

TourOverlay.propTypes = {
  steps: PropTypes.array,
  currentStepIndex: PropTypes.number,
  onHideClick: PropTypes.func
};
