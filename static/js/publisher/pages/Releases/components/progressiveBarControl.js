import { useState } from "react";
import { connect } from "react-redux";
import { Slider } from "@canonical/react-components";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../actions/pendingReleases";

function ProgressiveBarControl({ releases }) {
  const [percentageOfDevices, setPercentageOfDevices] = useState(100);

  const setTargetPercentage = () => {
    Object.keys(releases).forEach((key) => {
      releases[key].progressive.percentage = percentageOfDevices;
    });
  };

  return (
    <div className="progressive-release-control">
      <div className="progressive-release-control__inner">
        <div>Release all to</div>
        <div className="p-release-details-row__progress">
          <Slider
            label="Percentage of devices"
            min={1}
            max={100}
            value={percentageOfDevices}
            onChange={(e) => {
              setPercentageOfDevices(e.target.value);
              setTargetPercentage();
              updateProgressiveReleasePercentage(e.target.value);
            }}
          />
          <span>
            <span className="p-tooltip--btm-center">
              <span className="p-help">{percentageOfDevices}% of devices</span>
              <span className="p-tooltip__message">
                Releases are delivered to devices via snap refreshes, as such,
                it may
                <br />
                take some time for devices to receive the new version. There is
                also no
                <br />
                guarantee that this release will achieve the entire target
                percentage.
              </span>
            </span>
          </span>
        </div>
      </div>
      <div className="p-release-details-row__notes">
        <small>
          {100 - percentageOfDevices}% of devices will stay on the current
          version
        </small>
      </div>
    </div>
  );
}

ProgressiveBarControl.propTypes = {
  release: PropTypes.array,
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateProgressiveReleasePercentage: (percentage) =>
      dispatch(updateProgressiveReleasePercentage(percentage)),
  };
};

export default connect(null, mapDispatchToProps)(ProgressiveBarControl);
