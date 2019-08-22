import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

export default function Tour({ target }) {
  // ignore elements that are not in DOM
  if (!document.contains(target)) {
    target = null;
  }

  const [showTour, setShowTour] = useState(false);

  const onShowTour = () => setShowTour(true);
  const onHideTour = () => setShowTour(false);

  return (
    <Fragment>
      <TourBar onButtonClick={onShowTour} />

      {showTour && <TourOverlay target={target} onHideClick={onHideTour} />}
    </Fragment>
  );
}

Tour.propTypes = {
  target: PropTypes.instanceOf(Element)
};
