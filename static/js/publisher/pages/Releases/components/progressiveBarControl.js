import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../actions/pendingReleases";

import progressiveTypes from "./releasesConfirmDetails/types";

import { InteractiveProgressiveBar } from "./progressiveBar";

class ProgressiveBarControl extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeHandler = this.onChangeHandler.bind(this);
  }

  onChangeHandler(percentage) {
    const { updateProgressiveReleasePercentage, updateGlobalPercentage } =
      this.props;

    if (updateGlobalPercentage) {
      updateGlobalPercentage(percentage);
    }
    updateProgressiveReleasePercentage(percentage);
  }

  render() {
    const { release, type, globalPercentage } = this.props;

    if (!release.progressive) {
      return false;
    }

    let startingPercentage = 100;
    let targetPercentage = 100;

    if (globalPercentage) {
      startingPercentage = targetPercentage = globalPercentage;
    } else {
      switch (type) {
        case progressiveTypes.RELEASE:
          startingPercentage = targetPercentage =
            release.progressive.percentage;
          break;
        case progressiveTypes.UPDATE:
          startingPercentage = release.revision.release.progressive.percentage;
          targetPercentage = release.progressive.percentage;
          break;
        default:
      }
    }

    return (
      <div className="progressive-release-control">
        <div className="progressive-release-control__inner">
          <div>Release all to</div>
          <div className="p-release-details-row__progress">
            <InteractiveProgressiveBar
              percentage={startingPercentage}
              onChange={this.onChangeHandler}
              targetPercentage={targetPercentage}
              minPercentage={1}
              singleDirection={type === progressiveTypes.UPDATE ? 1 : 0}
            />
            <span>
              <span className="p-tooltip--btm-center">
                <span className="p-help">{targetPercentage}% of devices</span>
                <span className="p-tooltip__message">
                  Releases are delivered to devices via snap refreshes, as such,
                  it may
                  <br />
                  take some time for devices to receive the new version. There
                  is also no
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
            {100 - targetPercentage}% of devices will stay on the current
            version
          </small>
        </div>
      </div>
    );
  }
}

ProgressiveBarControl.propTypes = {
  release: PropTypes.object,
  type: PropTypes.string,
  globalPercentage: PropTypes.number,
  updateGlobalPercentage: PropTypes.func,
  updateProgressiveReleasePercentage: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateProgressiveReleasePercentage: (percentage) =>
      dispatch(updateProgressiveReleasePercentage(percentage)),
  };
};

export default connect(null, mapDispatchToProps)(ProgressiveBarControl);
