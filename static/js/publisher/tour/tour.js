import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

export default function Tour({ steps }) {
  const [showTour, setShowTour] = useState(false);

  const onShowTour = () => setShowTour(true);
  const onHideTour = () => setShowTour(false);

  return (
    <Fragment>
      <TourBar onButtonClick={onShowTour} />

      {showTour && <TourOverlay steps={steps} onHideClick={onHideTour} />}
    </Fragment>
  );
}

Tour.propTypes = {
  steps: PropTypes.array
};
