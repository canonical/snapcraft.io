import React from "react";
import PropTypes from "prop-types";

const ProgressiveConfirm = ({ percentage, onChange }) => {
  return (
    <div className="p-releases-confirm__rollout">
      <label htmlFor="rollout">
        Release to{" "}
        <input
          className="p-releases-confirm__rollout-percentage"
          type="number"
          max="100"
          min="1"
          name="rollout-percentage"
          value={percentage}
          onChange={onChange}
        />
        % of devices
      </label>
    </div>
  );
};

ProgressiveConfirm.propTypes = {
  percentage: PropTypes.number,
  onChange: PropTypes.func
};

export default ProgressiveConfirm;
