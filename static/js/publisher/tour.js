import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

const MASK_OFFSET = 5;

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

const getClipPathFromMask = ({ top, bottom, left, right }) => {
  let mask = [
    `${left}px ${top}px`,
    `${left}px ${bottom}px`,
    `${right}px ${bottom}px`,
    `${right}px ${top}px`,
    `${left}px ${top}px`
  ].join(",");

  return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${mask})`;
};

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

function Tour({ targetEl }) {
  const [rect, setRect] = useState(targetEl ? getRectFromEl(targetEl) : null);
  const overlayEl = useRef(null);

  const mask = rect ? getMaskFromRect(rect) : null;
  let maskStyle = {};
  let tooltipStyle = {};

  if (mask) {
    const clipPath = rect ? getClipPathFromMask(getMaskFromRect(rect)) : {};
    maskStyle = {
      clipPath,
      WebkitClipPath: clipPath
    };

    tooltipStyle = {
      top: mask.bottom,
      left: mask.left > MASK_OFFSET ? mask.left : MASK_OFFSET
    };
  }

  const onClick = event => {
    overlayEl.current.style.pointerEvents = "none";
    var x = event.clientX,
      y = event.clientY,
      elementMouseIsOver = document.elementFromPoint(x, y);
    overlayEl.current.style.pointerEvents = "";

    setRect(getRectFromEl(elementMouseIsOver));
  };

  return (
    <div className="p-tour-overlay" ref={overlayEl} onClick={onClick}>
      <div className="p-tour-overlay__mask" style={maskStyle} />

      <div
        className="p-card--tour is-tooltip--bottom-left"
        style={tooltipStyle}
      >
        <h4>Welcome to the demo tour!</h4>
        <p>
          This is just a test to see how to position such information and how to
          mask overlay background to highlight target element.
        </p>
        <p>Click around and see how overlay highlights the element.</p>
        <p>Thank you for testing!</p>

        <p className="p-tour-controls">
          <span>
            Done?{" "}
            <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Skip tour</a>.
          </span>

          <span className="p-tour-controls__buttons">
            <small className="p-tour-controls__step">1/1</small>
            <button
              disabled
              className="p-button--neutral is-inline has-icon u-no-margin--bottom"
            >
              <i className="p-icon--contextual-menu is-prev">Previous step</i>
            </button>
            <button
              disabled
              className="p-button--positive is-inline has-icon u-no-margin--bottom u-no-margin--right"
            >
              <i className="p-icon--contextual-menu is-light is-next">
                Next step
              </i>
            </button>
          </span>
        </p>
      </div>
    </div>
  );
}

Tour.propTypes = {
  targetEl: PropTypes.node
};

export default function initTour() {
  const tour = document.createElement("div");
  document.body.appendChild(tour);

  const target = document.querySelector("h2");
  ReactDOM.render(<Tour targetEl={target} />, tour);
}
