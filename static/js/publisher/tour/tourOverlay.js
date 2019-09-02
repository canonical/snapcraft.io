import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import debounce from "../../libs/debounce";

import TourStepCard from "./tourStepCard";
import TourOverlayMask from "./tourOverlayMask";
import { tourFinished, tourSkipped } from "./metricsEvents";
import { getMaskFromElements, prepareSteps } from "./helpers";
import {
  SCROLL_MARGIN,
  SCROLL_OFFSET_TOP,
  SCROLL_OFFSET_BOTTOM
} from "./constants";

import { animateScrollTo } from "../../public/scroll-to";

export default function TourOverlay({ steps, hideTour, currentStepIndex = 0 }) {
  steps = prepareSteps(steps);

  let setCurrentStepIndex;
  [currentStepIndex, setCurrentStepIndex] = useState(currentStepIndex);

  const step = steps[currentStepIndex];

  // when current step changes, scroll step element into view
  useEffect(
    () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // when tooltip is on top of the mask, scroll into view aligning to bottom
      if (step.position.indexOf("top") === 0) {
        // scroll element into view aligning it to bottom
        // only if it's below the bottom border of the screen
        // or it's in the top half of the screen
        if (
          mask.bottom > scrollTop + window.innerHeight ||
          mask.top < SCROLL_MARGIN + scrollTop
        ) {
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
    [currentStepIndex] // refresh effect on step changes, to scroll to correct step
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
  useEffect(
    () => {
      const afterScroll = debounce(() => rerender(), 200);
      window.addEventListener("scroll", afterScroll);

      return () => {
        afterScroll.clear();
        window.removeEventListener("scroll", afterScroll);
      };
    },
    [] // don't refresh the effect on every render
  );

  // rerender after resize (to adjust to new positions of elements)
  // and hide mask during resize to avoid misalign of mask and tooltip
  useEffect(
    () => {
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
        afterResize.clear();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("resize", afterResize);
      };
    },
    [] // don't refresh the effect on every render
  );

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

  // close tour on ESC
  // treat as 'finished' on last step and as 'skipped' on any other step
  useEffect(
    () => {
      const escClick = event => {
        if (event.keyCode === 27) {
          if (currentStepIndex === steps.length - 1) {
            onFinishClick();
          } else {
            onSkipClick();
          }
        }
      };
      window.addEventListener("keyup", escClick);

      return () => {
        window.removeEventListener("keyup", escClick);
      };
    },
    [currentStepIndex] // refresh effect when step changes, to pass correct step id into skip metrics
  );

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
