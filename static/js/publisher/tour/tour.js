import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

import { tourStartedAutomatically } from "./metricsEvents";

export default function Tour({ steps, onTourClosed, startTour = false }) {
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
  const hideTour = () => {
    setIsTourOpen(false);

    // if close callback was defined call it now
    if (onTourClosed) {
      onTourClosed();
    }
  };

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
  onTourClosed: PropTypes.func
};
