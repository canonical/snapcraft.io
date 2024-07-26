import { ReactNode } from "react";

type Props = {
  steps: Array<{
    id: string;
    position: string;
    elements: HTMLElement[];
    content: string;
    title: string;
  }>;
  currentStepIndex: number;
  mask: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  onFinishClick: () => void;
  onSkipClick: () => void;
  onNextClick: () => void;
  onPrevClick: () => void;
};

export default function TourStepCard({
  steps,
  currentStepIndex,
  mask,
  onFinishClick,
  onSkipClick,
  onNextClick,
  onPrevClick,
}: Props): ReactNode {
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
        left: mask.left,
      };
      break;
    case "bottom-right":
      tooltipStyle = {
        top: mask.bottom,
        right: overlayWidth - mask.right,
      };
      break;
    case "top-left":
      tooltipStyle = {
        bottom: overlayHeight - mask.top,
        left: mask.left,
      };
      break;
    case "top-right":
      tooltipStyle = {
        bottom: overlayHeight - mask.top,
        right: overlayWidth - mask.right,
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
            Done? <a onClick={onSkipClick}>Skip tour</a>.
          </span>
        )}

        <small className="p-tour-controls__step">
          {currentStepIndex + 1}/{steps.length}
        </small>
        <span className="p-tour-controls__buttons">
          <button
            disabled={currentStepIndex === 0}
            onClick={onPrevClick}
            className="p-button has-icon u-no-margin--bottom"
          >
            <i className="p-icon--chevron-up is-prev">Previous step</i>
          </button>
          <button
            onClick={isLastStep ? onFinishClick : onNextClick}
            className="p-button--positive has-icon u-no-margin--bottom u-no-margin--right"
          >
            {isLastStep ? (
              "Finish tour"
            ) : (
              <i className="p-icon--chevron-up is-light is-next">Next step</i>
            )}
          </button>
        </span>
      </p>
    </div>
  );
}
