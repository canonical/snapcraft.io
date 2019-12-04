import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { isProgressiveReleaseEnabled } from "../../selectors";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveRow from "./progressiveRow";
import CloseChannelsRow from "./closeChannelsRow";

const ReleasesConfirmDetails = ({ updates, isProgressiveReleaseEnabled }) => {
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

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases &&
        Object.keys(progressiveReleases).map(releaseKey => {
          return (
            <ProgressiveRow
              release={progressiveReleases[releaseKey]}
              type={progressiveTypes.RELEASE}
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
          const notes = "Cannot be progressively released";

          return (
            <ReleaseRow
              type="Release"
              revisionInfo={revisionInfo}
              channel={channel}
              notes={notes}
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
  isProgressiveReleaseEnabled: PropTypes.bool
};

const mapStateToProps = state => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state)
});

export default connect(mapStateToProps)(ReleasesConfirmDetails);
