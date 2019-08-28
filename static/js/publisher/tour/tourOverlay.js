import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import debounce from "../../libs/debounce";

import TourStepCard from "./tourStepCard";
import TourOverlayMask from "./tourOverlayMask";
import { tourFinished, tourSkipped } from "./metricsEvents";

import { animateScrollTo } from "../../public/scroll-to";

const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);
const MASK_OFFSET = REM / 2; // .5rem  is a default spacing unit in Vanilla

const SCROLL_MARGIN = 400; // if element highlighted element doesn't fit into this top/bottom area of the screen, we scroll it into view
const SCROLL_OFFSET_TOP = 100; // to make sure we position elements below sticky header on listing page
const SCROLL_OFFSET_BOTTOM = 10;

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

// calculate mask for given element
const getMaskFromEl = el => getMaskFromRect(getRectFromEl(el));

// check if element is part of the DOM and is visible
const isVisibleInDocument = el =>
  document.contains(el) && !(el.offsetWidth === 0 && el.offsetHeight === 0);

// get mask that is an union of all elements' masks
// calculates the rectangle that contains each individual element rectangles
const getMaskFromElements = elements => {
  const masks = elements
    .filter(isVisibleInDocument)
    .map(el => getMaskFromEl(el));

  return masks.reduce(
    (unionMask, elMask) => {
      return {
        top: Math.min(unionMask.top, elMask.top),
        left: Math.min(unionMask.left, elMask.left),
        bottom: Math.max(unionMask.bottom, elMask.bottom),
        right: Math.max(unionMask.right, elMask.right)
      };
    },
    {
      top: Infinity,
      left: Infinity,
      right: 0,
      bottom: 0
    }
  );
};

// find DOM elements for each step, ignore steps with no elements
// set default position to "bottom-left"
function prepareSteps(steps) {
  return steps
    .map(step => {
      return {
        ...step,
        elements: [].slice.apply(
          document.querySelectorAll(`[data-tour="${step.id}"]`)
        ),
        position: step.position || "bottom-left"
      };
    })
    .filter(step => step.elements.length > 0);
}

export default function TourOverlay({ steps, hideTour }) {
  steps = prepareSteps(steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = steps[currentStepIndex];

  // when current step changes, scroll step element into view
  useEffect(
    () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // when tooltip is on top of the mask, scroll into view aligning to bottom
      if (step.position.indexOf("top") === 0) {
        // scroll element into view aligning it to bottom
        // only if it's in the top half of the screen
        if (mask.top < SCROLL_MARGIN + scrollTop) {
          animateScrollTo(
            // we scroll relative to top of the screen, but we want to stick to bottom
            // so we need to substract the window height
            mask.bottom - window.innerHeight,
            -SCROLL_OFFSET_BOTTOM
          );
        }
      }
      // when tooltip is on the bottom of the mask, scroll aligning to top
      if (step.position.indexOf("bottom") === 0) {
        // scroll element into view, but only if it's higher on page than top offset
        // or it is in the bottom half of screen
        if (
          mask.top < SCROLL_OFFSET_TOP + scrollTop ||
          mask.bottom > SCROLL_MARGIN + scrollTop
        ) {
          animateScrollTo(mask.top, SCROLL_OFFSET_TOP);
        }
      }
    },
    [currentStepIndex]
  );
  const overlayEl = useRef(null);

  const mask = getMaskFromElements(step.elements);

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

  const onFinishClick = () => {
    tourFinished(step.id);
    hideTour();
  };

  const onSkipClick = () => {
    tourSkipped(step.id);
    hideTour();
  };

  return (
    <div className="p-tour-overlay" ref={overlayEl}>
      <TourOverlayMask mask={isResizing ? null : mask} />
      <TourStepCard
        steps={steps}
        currentStepIndex={currentStepIndex}
        mask={mask}
        onFinishClick={onFinishClick}
        onSkipClick={onSkipClick}
        onNextClick={onNextClick}
        onPrevClick={onPrevClick}
      />
    </div>
  );
}

TourOverlay.propTypes = {
  steps: PropTypes.array,
  currentStepIndex: PropTypes.number,
  hideTour: PropTypes.func
};
