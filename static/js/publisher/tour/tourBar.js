import React from "react";
import PropTypes from "prop-types";

export default function TourBar({ onButtonClick }) {
  return (
    <div className="p-tour-bar">
      <div className="u-fixed-width u-clearfix">
        <button className="p-tour-bar__button" onClick={onButtonClick}>
          <i className="p-icon--question">Tour</i>
        </button>
      </div>
    </div>
  );
}

TourBar.propTypes = {
  onButtonClick: PropTypes.func
};
