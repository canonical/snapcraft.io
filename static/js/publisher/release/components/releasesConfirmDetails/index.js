import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../../selectors";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveRow from "./progressiveRow";
import CloseChannelsRow from "./closeChannelsRow";

import { InteractiveProgressiveBar } from "../progressiveBar";

const ReleasesConfirmDetails = ({
  updates,
  isProgressiveReleaseEnabled,
  updateProgressiveReleasePercentage
}) => {
  const [useGlobal, setGlobal] = useState(false);
  const [globalPercentage, setGlobalPercentage] = useState(100);

  const progressiveReleases = updates.newReleasesToProgress;
  const progressiveUpdates = updates.progressiveUpdates;
  const progressiveCancellations = updates.cancelProgressive;
  const newReleases = updates.newReleases;
  const pendingCloses = updates.pendingCloses;

  const showProgressiveReleases =
    isProgressiveReleaseEnabled && Object.keys(progressiveReleases).length > 0;
  const showProgressiveUpdates =
    isProgressiveReleaseEnabled && Object.keys(progressiveUpdates).length > 0;
  const showProgressiveCancellations =
    isProgressiveReleaseEnabled &&
    Object.keys(progressiveCancellations).length > 0;
  const showNewReleases = Object.keys(newReleases).length > 0;
  const showPendingCloses = pendingCloses.length > 0;

  const toggleGlobal = () => {
    setGlobal(!useGlobal);
  };

  const updatePercentage = percentage => {
    setGlobalPercentage(percentage);
    updateProgressiveReleasePercentage(null, percentage);
  };

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases && (
        <div className="p-releases-confirm__details-global row u-vertically-center">
          <div className="col-4">
            <label>
              <span>
                <span className="p-tooltip--btm-left">
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
                    Releases are delivered to devices via snap refreshes, as
                    such, it may
                    <br />
                    take some time for devices to receive the new version. There
                    is also no
                    <br />
                    guarentee that this release will achieve the entire target
                    percentage.
                  </span>
                </span>
              </span>
            </div>
          )}
        </div>
      )}
      {showProgressiveReleases &&
        Object.keys(progressiveReleases).map(releaseKey => {
          return (
            <ProgressiveRow
              release={progressiveReleases[releaseKey]}
              type={progressiveTypes.RELEASE}
              globalPercentage={useGlobal ? globalPercentage : null}
              key={releaseKey}
            />
          );
        })}
      {showProgressiveUpdates &&
        Object.keys(progressiveUpdates).map(releaseKey => {
          return (
            <ProgressiveRow
              release={progressiveUpdates[releaseKey]}
              type={progressiveTypes.UPDATE}
              key={releaseKey}
            />
          );
        })}
      {showProgressiveCancellations &&
        Object.keys(progressiveCancellations).map(releaseKey => {
          return (
            <CancelProgressiveRow
              release={progressiveCancellations[releaseKey]}
              key={releaseKey}
            />
          );
        })}
      {showNewReleases &&
        Object.keys(newReleases).map(releaseKey => {
          const release = newReleases[releaseKey];
          const revisionInfo = release.revision;
          const channel = release.channel;

          return (
            <ReleaseRow
              type="Release"
              revisionInfo={revisionInfo}
              channel={channel}
              key={`${revisionInfo.revision}-{${channel}`}
            />
          );
        })}
      {showPendingCloses && <CloseChannelsRow channels={pendingCloses} />}
    </div>
  );
};

ReleasesConfirmDetails.propTypes = {
  updates: PropTypes.object.isRequired,
  isProgressiveReleaseEnabled: PropTypes.bool,
  updateProgressiveReleasePercentage: PropTypes.func
};

const mapStateToProps = state => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state)
});

const mapDispatchToProps = dispatch => {
  return {
    updateProgressiveReleasePercentage: (key, percentage) =>
      dispatch(updateProgressiveReleasePercentage(key, percentage))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesConfirmDetails);
