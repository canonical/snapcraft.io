import React from "react";
import PropTypes from "prop-types";

export default function HistoryIcon({ onClick }) {
  return (
    <span className="p-release-data__icon" onClick={onClick}>
      <span className="p-icon p-icon--history">History</span>
    </span>
  );
}

HistoryIcon.propTypes = {
  onClick: PropTypes.func.isRequired
};
