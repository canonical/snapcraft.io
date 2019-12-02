import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../selectors";

import { InteractiveProgressiveBar } from "./progressiveBar";

const ReleaseRow = ({ revisionInfo, channel, progress, notes }) => (
  <div className="p-releases-confirm-details__row">
    <span className="p-releases-confirm-details__row-revision">
      {revisionInfo.revision} ({revisionInfo.version}){" "}
      {revisionInfo.architectures.join(", ")}
    </span>
    <span className="p-releases-confirm-details__row-join">to</span>
    <span className="p-releases-confirm-details__row-channel">{channel}</span>
    {progress && (
      <Fragment>
        <span className="p-releases-confirm-details__row-join">on</span>
        <span className="p-releases-confirm-details__row-progress">
          {progress}
        </span>
      </Fragment>
    )}
    {!progress && (
      <Fragment>
        <span />
        <span />
      </Fragment>
    )}
    {notes && (
      <span className="p-releases-confirm-details__row-notes">
        <small>{notes}</small>
      </span>
    )}
  </div>
);

ReleaseRow.propTypes = {
  revisionInfo: PropTypes.object,
  channel: PropTypes.node,
  progress: PropTypes.node,
  notes: PropTypes.node
};

const _ProgressiveRow = ({ release, updateProgressiveReleasePercentage }) => {
  const [percentage, setPercentage] = useState(
    release.progressive ? release.progressive.percentage : 100
  );
  const revisionInfo = release.revision;
  const channel = release.channel;
  const updatePercentage = percentage => {
    setPercentage(percentage);
    updateProgressiveReleasePercentage(release.progressive.key, percentage);
  };
  const progress = (
    <Fragment>
      <InteractiveProgressiveBar
        percentage={percentage}
        onChange={updatePercentage}
        targetPercentage={percentage}
        min={1}
      />
      <span>
        <span className="p-tooltip--btm-right">
          <span className="p-help">{percentage}% of devices</span>
          <span className="p-tooltip__message">
            Releases are delivered to devices via snap refreshes, as such, is
            may
            <br />
            take some time for devices to receive the new version. There is also
            no
            <br />
            guarentee that this release will achieve the entire target
            percentage.
          </span>
        </span>
      </span>
    </Fragment>
  );

  let notes;
  if (release.previousRevisions) {
    const prevArch = Object.keys(release.previousRevisions)[0];
    const prevRev = release.previousRevisions[prevArch].revision;
    const prevVer = release.previousRevisions[prevArch].version;

    notes = `${100 -
      percentage}% of devices will stay on ${prevRev} (${prevVer})`;
  }

  return (
    <ReleaseRow
      revisionInfo={revisionInfo}
      channel={channel}
      progress={progress}
      notes={notes}
    />
  );
};

_ProgressiveRow.propTypes = {
  release: PropTypes.object,
  updateProgressiveReleasePercentage: PropTypes.func
};

const mapDispatchToProps = dispatch => {
  return {
    updateProgressiveReleasePercentage: (key, percentage) =>
      dispatch(updateProgressiveReleasePercentage(key, percentage))
  };
};

const ProgressiveRow = connect(
  null,
  mapDispatchToProps
)(_ProgressiveRow);

const CloseChannelRow = ({ channel }) => (
  <div className="p-releases-confirm-details__row is-closing">
    <span>
      Close <b>{channel}</b> channel
    </span>
  </div>
);

CloseChannelRow.propTypes = {
  channel: PropTypes.string
};

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
              key={releaseKey}
            />
          );
        })}
      {showProgressiveUpdates &&
        Object.keys(progressiveUpdates).map(releaseKey => {
          return (
            <ProgressiveRow
              release={progressiveUpdates[releaseKey]}
              key={releaseKey}
            />
          );
        })}
      {showProgressiveCancellations &&
        Object.keys(progressiveCancellations).map(releaseKey => {
          return (
            <ProgressiveRow
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
              revisionInfo={revisionInfo}
              channel={channel}
              notes={notes}
              key={`${revisionInfo.revision}-{${channel}`}
            />
          );
        })}
      {showPendingCloses &&
        pendingCloses.map(channel => (
          <CloseChannelRow channel={channel} key={channel} />
        ))}
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
