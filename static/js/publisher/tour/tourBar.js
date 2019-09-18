import React from "react";
import PropTypes from "prop-types";

import { tourStartedByUser } from "./metricsEvents";

export default function TourBar({ showTour }) {
  const onButtonClick = () => {
    tourStartedByUser();
    showTour();
  };

  return (
    <div className="p-tour-bar">
      <div className="u-fixed-width u-clearfix">
        <button
          className="p-button has-icon p-tour-bar__button"
          data-tour="tour-end"
          onClick={onButtonClick}
        >
          <i className="p-icon--question">Tour</i>
        </button>
      </div>
    </div>
  );
}

TourBar.propTypes = {
  showTour: PropTypes.func
};
