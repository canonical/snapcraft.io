import React from "react";
import PropTypes from "prop-types";

export default function TourStepCard({
  steps,
  currentStepIndex,
  mask,
  onHideClick,
  onNextClick,
  onPrevClick
}) {
  const step = steps[currentStepIndex];

  let tooltipStyle = {};

  // for positioning relative to right/bottom of the screen
  const overlayHeight = document.body.clientHeight;
  const overlayWidth = document.body.clientWidth;

  switch (step.position) {
    // TODO: support for all available tooltip positions
    case "bottom-left":
      tooltipStyle = {
        top: mask.bottom,
        left: mask.left
      };
      break;
    case "top-left":
      tooltipStyle = {
        bottom: overlayHeight - mask.top,
        left: mask.left
      };
      break;
    case "top-right":
      tooltipStyle = {
        bottom: overlayHeight - mask.top,
        right: overlayWidth - mask.right
      };
      break;
  }

  // step content is controlled by us and passed as data to component directly
  // so it should be safe to set it via dangerouslySetInnerHTML
  const content = { __html: step.content };

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div
      className={`p-card--tour is-tooltip--${step.position}`}
      style={tooltipStyle}
    >
      <h4>{step.title}</h4>
      <div
        className="p-card--tour__content"
        dangerouslySetInnerHTML={content}
      />

      <p className="p-tour-controls">
        {!isLastStep && (
          <span>
            Done? <a onClick={onHideClick}>Skip tour</a>.
          </span>
        )}

        <span className="p-tour-controls__buttons">
          <small className="p-tour-controls__step">
            {currentStepIndex + 1}/{steps.length}
          </small>
          <button
            disabled={currentStepIndex === 0}
            onClick={onPrevClick}
            className="p-button--neutral is-inline has-icon u-no-margin--bottom"
          >
            <i className="p-icon--contextual-menu is-prev">Previous step</i>
          </button>
          <button
            onClick={isLastStep ? onHideClick : onNextClick}
            className="p-button--positive is-inline has-icon u-no-margin--bottom u-no-margin--right"
          >
            {isLastStep ? (
              "Finish tour"
            ) : (
              <i className="p-icon--contextual-menu is-light is-next">
                Next step
              </i>
            )}
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
  }).isRequired,
  steps: PropTypes.array.isRequired,
  currentStepIndex: PropTypes.number.isRequired,
  onHideClick: PropTypes.func.isRequired,
  onNextClick: PropTypes.func.isRequired,
  onPrevClick: PropTypes.func.isRequired
};
