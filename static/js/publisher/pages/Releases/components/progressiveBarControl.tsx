import React from "react";
import { connect } from "react-redux";

import { updateProgressiveReleasePercentage } from "../actions/pendingReleases";
import type { PendingReleaseItem, DispatchFn } from "../../../types/releaseTypes";
import type { ProgressiveType } from "./releasesConfirmDetails/types";

import progressiveTypes from "./releasesConfirmDetails/types";

import { InteractiveProgressiveBar } from "./progressiveBar";

interface ProgressiveBarControlProps {
  release: PendingReleaseItem;
  type?: ProgressiveType;
  globalPercentage?: number;
  updateGlobalPercentage?: (percentage: number) => void;
  updateProgressiveReleasePercentage?: (percentage: number) => void;
  minPercentage?: number;
}

class ProgressiveBarControl extends React.Component<ProgressiveBarControlProps> {
  constructor(props: ProgressiveBarControlProps) {
    super(props);

    this.onChangeHandler = this.onChangeHandler.bind(this);
  }

  onChangeHandler(percentage: number) {
    const { updateProgressiveReleasePercentage, updateGlobalPercentage } =
      this.props;

    if (updateGlobalPercentage) {
      updateGlobalPercentage(percentage);
    }
    updateProgressiveReleasePercentage?.(percentage);
  }

  render() {
    const { release, type, globalPercentage, minPercentage: _minPercentage } = this.props;
    const minPercentage = _minPercentage ?? 0;

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
            release.progressive.percentage ?? 100;
          break;
        case progressiveTypes.UPDATE:
          startingPercentage = release.revision.release?.progressive.percentage ?? 100;
          targetPercentage = release.progressive.percentage ?? 100;
          break;
        default:
      }
    }

    return (
      <div className="progressive-release-control">
        <div className="progressive-release-control__inner">
          <div>
            <b>Release all to</b>
          </div>
          <div className="p-release-details-row__progress">
            <InteractiveProgressiveBar
              percentage={startingPercentage}
              onChange={this.onChangeHandler}
              targetPercentage={targetPercentage}
              minPercentage={minPercentage}
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
            version.
            {minPercentage > 1 && (
              <>
                <br />
                {minPercentage}% is the lowest percentage all revisions can be
                released to.
              </>
            )}
          </small>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch: DispatchFn) => {
  return {
    updateProgressiveReleasePercentage: (percentage: number) =>
      dispatch(updateProgressiveReleasePercentage(percentage)),
  };
};

export default connect(null, mapDispatchToProps)(ProgressiveBarControl);
