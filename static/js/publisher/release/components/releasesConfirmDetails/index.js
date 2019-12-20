import React, { useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import {
  updateProgressiveReleasePercentage,
  setTemporaryProgressiveReleaseKeys,
  removeTemporaryProgressiveReleaseKeys
} from "../../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../../selectors";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveRow from "./progressiveRow";
import ProgressiveRowGroup from "./progressiveRowGroup";
import CloseChannelsRow from "./closeChannelsRow";

const ReleasesConfirmDetails = ({
  updates,
  isProgressiveReleaseEnabled,
  updateProgressiveReleasePercentage,
  setTemporaryProgressiveReleaseKeys,
  removeTemporaryProgressiveReleaseKeys
}) => {
  const [useGlobal, setGlobal] = useState(true);
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
    const newUseGlobal = !useGlobal;
    setGlobal(newUseGlobal);
    if (!newUseGlobal) {
      setTemporaryProgressiveReleaseKeys();
    } else {
      removeTemporaryProgressiveReleaseKeys();
    }
  };

  const updatePercentage = percentage => {
    setGlobalPercentage(percentage);
    updateProgressiveReleasePercentage(null, percentage);
  };

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases && (
        <ProgressiveRowGroup
          releases={progressiveReleases}
          useGlobal={useGlobal}
          globalPercentage={globalPercentage}
          toggleGlobal={toggleGlobal}
          updatePercentage={updatePercentage}
        />
      )}
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
  updateProgressiveReleasePercentage: PropTypes.func,
  setTemporaryProgressiveReleaseKeys: PropTypes.func,
  removeTemporaryProgressiveReleaseKeys: PropTypes.func
};

const mapStateToProps = state => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state)
});

const mapDispatchToProps = dispatch => {
  return {
    updateProgressiveReleasePercentage: (key, percentage) =>
      dispatch(updateProgressiveReleasePercentage(key, percentage)),
    setTemporaryProgressiveReleaseKeys: () =>
      dispatch(setTemporaryProgressiveReleaseKeys()),
    removeTemporaryProgressiveReleaseKeys: () =>
      dispatch(removeTemporaryProgressiveReleaseKeys())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesConfirmDetails);
