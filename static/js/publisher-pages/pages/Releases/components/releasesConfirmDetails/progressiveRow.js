import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../../actions/pendingReleases";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";

import { ProgressiveBar, InteractiveProgressiveBar } from "../progressiveBar";

class ProgressiveRow extends React.Component {
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
    const { release, type, globalPercentage, updateGlobalPercentage } =
      this.props;

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

    const revisionInfo = release.revision;
    const channel = release.channel;

    const isInteractive = !globalPercentage || updateGlobalPercentage;

    let progress;
    if (
      type === progressiveTypes.UPDATE &&
      release.progressive.changes.some((change) => change.key === "paused")
    ) {
      const paused = release.progressive.changes.find(
        (change) => change.key === "paused",
      ).value;
      progress = (
        <Fragment>
          <ProgressiveBar percentage={startingPercentage} />
          <span>{paused ? "Paused" : "Resumed"}</span>
        </Fragment>
      );
    } else {
      progress = (
        <Fragment>
          {!isInteractive && (
            <ProgressiveBar percentage={globalPercentage} disabled={true} />
          )}
          {isInteractive && (
            <InteractiveProgressiveBar
              percentage={startingPercentage}
              onChange={this.onChangeHandler}
              targetPercentage={targetPercentage}
              minPercentage={1}
              singleDirection={type === progressiveTypes.UPDATE ? 1 : 0}
            />
          )}
          <span>
            <span className="p-tooltip--btm-center">
              <span className="p-help">{targetPercentage}% of devices</span>
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
        </Fragment>
      );
    }

    let notes;
    if (release.previousRevisions) {
      const prevRev = release.previousRevisions[0].revision;
      const prevVer = release.previousRevisions[0].version;

      notes = `${
        100 - targetPercentage
      }% of devices will stay on ${prevRev} (${prevVer})`;
    }

    const displayType = type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <ReleaseRow
        type={displayType}
        revisionInfo={revisionInfo}
        channel={channel}
        progress={progress}
        notes={notes}
      />
    );
  }
}

ProgressiveRow.propTypes = {
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

export default connect(null, mapDispatchToProps)(ProgressiveRow);
