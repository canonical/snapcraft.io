import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

import { tourStartedAutomatically } from "./metricsEvents";

export default function Tour({
  steps,
  onTourStarted,
  onTourClosed,
  startTour = false
}) {
  // send metrics event if tour started automatically
  useEffect(
    () => {
      if (startTour) {
        tourStartedAutomatically();
      }
    },
    [startTour]
  );

  const [isTourOpen, setIsTourOpen] = useState(startTour);

  const showTour = () => setIsTourOpen(true);
  const hideTour = () => setIsTourOpen(false);

  // trigger callbacks when tour is started or finished
  useEffect(
    () => {
      if (isTourOpen && onTourStarted) {
        onTourStarted();
      }
      if (!isTourOpen && onTourClosed) {
        onTourClosed();
      }
    },
    [isTourOpen]
  );

  return (
    <Fragment>
      <TourBar showTour={showTour} />

      {isTourOpen && <TourOverlay steps={steps} hideTour={hideTour} />}
    </Fragment>
  );
}

Tour.propTypes = {
  steps: PropTypes.array.isRequired,
  startTour: PropTypes.bool,
  onTourStarted: PropTypes.func,
  onTourClosed: PropTypes.func
};
