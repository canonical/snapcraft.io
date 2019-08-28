import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

export default function Tour({ steps }) {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const showTour = () => setIsTourOpen(true);
  const hideTour = () => setIsTourOpen(false);

  return (
    <Fragment>
      <TourBar showTour={showTour} />

      {isTourOpen && <TourOverlay steps={steps} hideTour={hideTour} />}
    </Fragment>
  );
}

Tour.propTypes = {
  steps: PropTypes.array.isRequired
};
