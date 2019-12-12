import React from "react";
import PropTypes from "prop-types";

import { InteractiveProgressiveBar } from "../progressiveBar";

const GlobalRow = ({
  useGlobal,
  toggleGlobal,
  globalPercentage,
  updatePercentage
}) => {
  return (
    <div className="p-releases-confirm__details-global row u-vertically-center">
      <div className="col-4">
        <label>
          <span>
            <span className="p-tooltip--btm-center">
              <span className="p-help">
                Use the same progressive release percentage
              </span>
              <span className="p-tooltip__message">
                For new progressive releases
              </span>
            </span>
          </span>
          <span className="p-releases-confirm__details-switch">
            <input
              type="checkbox"
              className="p-switch"
              checked={useGlobal}
              onChange={toggleGlobal}
            />
            <div className="p-switch__slider" />
          </span>
        </label>
      </div>
      {useGlobal && (
        <div className="col-4 p-release-details-row__progress">
          <InteractiveProgressiveBar
            percentage={globalPercentage}
            targetPercentage={globalPercentage}
            minPercentage={1}
            singleDirection={0}
            onChange={updatePercentage}
          />
          <span>
            <span className="p-tooltip--btm-right">
              <span className="p-help">{globalPercentage}% of devices</span>
              <span className="p-tooltip__message">
                Releases are delivered to devices via snap refreshes, as such,
                it may
                <br />
                take some time for devices to receive the new version. There is
                also no
                <br />
                guarentee that this release will achieve the entire target
                percentage.
              </span>
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

GlobalRow.propTypes = {
  useGlobal: PropTypes.boolean,
  toggleGlobal: PropTypes.func,
  globalPercentage: PropTypes.number,
  updatePercentage: PropTypes.func
};

export default GlobalRow;
