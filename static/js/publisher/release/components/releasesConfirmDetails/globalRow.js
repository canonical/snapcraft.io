import React from "react";
import PropTypes from "prop-types";

const GlobalRow = ({ useGlobal, toggleGlobal }) => {
  return (
    <div className="p-release-details-row is-global">
      <span className="p-release-details-row__global-check">
        <input
          type="checkbox"
          checked={useGlobal}
          onChange={toggleGlobal}
          id="useGlobalToggle"
        />
        <label htmlFor="useGlobalToggle">
          Same percentage for all releases
        </label>
      </span>
    </div>
  );
};

GlobalRow.propTypes = {
  useGlobal: PropTypes.bool,
  toggleGlobal: PropTypes.func,
  globalPercentage: PropTypes.number,
  updatePercentage: PropTypes.func
};

export default GlobalRow;
