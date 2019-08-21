import React from "react";
import PropTypes from "prop-types";

import { MASK_OFFSET } from "./tour";

export default function TourStepCard({ mask }) {
  let tooltipStyle = {};

  if (mask) {
    tooltipStyle = {
      top: mask.bottom,
      left: mask.left > MASK_OFFSET ? mask.left : MASK_OFFSET
    };
  }

  return (
    <div className="p-card--tour is-tooltip--bottom-left" style={tooltipStyle}>
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
  );
}

TourStepCard.propTypes = {
  mask: PropTypes.shape({
    top: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number
  })
};
