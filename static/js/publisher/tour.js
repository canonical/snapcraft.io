import React from "react";
import ReactDOM from "react-dom";

import Tour from "./tour/tour";

// returns true if % of truthy values in the array is above the threshold
function isCompleted(fields, threshold = 0.5) {
  const completed = fields.filter(isCompleted => isCompleted);

  return completed.length / fields.length >= threshold;
}

export function initTour({ container, steps, onTourClosed, startTour }) {
  if (!document.contains(container)) {
    throw Error("initTour container element not found in document.");
  }
  if (!steps || !steps.length) {
    throw Error("initTour expects steps array as an argument.");
  }

  ReactDOM.render(
    <Tour steps={steps} onTourClosed={onTourClosed} startTour={startTour} />,
    container
  );
}

export function initListingTour({
  snapName,
  container,
  steps,
  completedFields
}) {
  const storageKey = `listing-tour-finished-${snapName}`;

  const isFormCompleted = isCompleted(completedFields);
  const isTourFinished = !!(
    window.localStorage && window.localStorage.getItem(storageKey)
  );
  const onTourClosed = () =>
    window.localStorage && window.localStorage.setItem(storageKey, true);

  // start the tour automatically if form is not completed
  // (has less than 50% fields filled), and the tour wasn't closed before
  const startTour = !isFormCompleted && !isTourFinished;

  initTour({ container, steps, onTourClosed, startTour });
}
