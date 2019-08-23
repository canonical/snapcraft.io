import React from "react";
import PropTypes from "prop-types";

import { MASK_OFFSET } from "./tourOverlay";

export default function TourStepCard({
  steps,
  currentStepIndex,
  mask,
  onHideClick
}) {
  const step = steps[currentStepIndex];

  let tooltipStyle = {};

  if (mask) {
    tooltipStyle = {
      top: mask.bottom,
      left: mask.left > MASK_OFFSET ? mask.left : MASK_OFFSET
    };
  }

  // step content is controlled by us and passed as data to component directly
  // so it should be safe to set it via dangerouslySetInnerHTML
  const content = { __html: step.content };

  return (
    <div className="p-card--tour is-tooltip--bottom-left" style={tooltipStyle}>
      <h4>{step.title}</h4>
      <div
        className="p-card--tour__content"
        dangerouslySetInnerHTML={content}
      />

      <p className="p-tour-controls">
        <span>
          Done? <a onClick={onHideClick}>Skip tour</a>.
        </span>

        <span className="p-tour-controls__buttons">
          <small className="p-tour-controls__step">
            {currentStepIndex + 1}/{steps.length}
          </small>
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
  }),
  steps: PropTypes.array,
  currentStepIndex: PropTypes.number,
  allStepsCount: PropTypes.number,
  onHideClick: PropTypes.func
};
