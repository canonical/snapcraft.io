import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../selectors";

import { ProgressiveBar, InteractiveProgressiveBar } from "./progressiveBar";

const progressiveTypes = {
  RELEASE: "release",
  UPDATE: "update",
  CANCELLATION: "cancel"
};

const ReleaseRow = ({ type, revisionInfo, channel, progress, notes }) => (
  <div className="p-releases-confirm-details__row">
    <span className="p-releases-confirm-details__row-type">{type}</span>
    <span className="p-releases-confirm-details__row-info">
      <span className="p-tooltip--btm-center">
        <b>{revisionInfo.revision}</b> to{" "}
        <span className="p-tooltip__message">
          Version: <b>{revisionInfo.version}</b>
        </span>{" "}
        <b>{channel}</b> on <b>{revisionInfo.architectures.join(", ")}</b>
      </span>
    </span>
    {progress && (
      <Fragment>
        <span className="p-releases-confirm-details__row-join">to</span>
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
  type: PropTypes.string,
  revisionInfo: PropTypes.object,
  channel: PropTypes.node,
  progress: PropTypes.node,
  notes: PropTypes.node
};

const CancelProgressiveRow = ({ release }) => {
  const revisionInfo = release.revision;

  return revisionInfo.architectures.map(arch => {
    const previousRevision = release.previousRevisions[0];
    return (
      <div
        className="p-releases-confirm-details__row is-closing"
        key={`close-${revisionInfo.revision}-${release.channel}`}
      >
        <span>
          Cancel progressive release of <b>{revisionInfo.revision}</b> in{" "}
          <b>{release.channel}</b> on <b>{arch}</b>. Revert to{" "}
          <b>{previousRevision.revision}</b>.
        </span>
      </div>
    );
  });
};

CancelProgressiveRow.propTypes = {
  release: PropTypes.object
};

const _ProgressiveRow = ({
  release,
  updateProgressiveReleasePercentage,
  type
}) => {
  if (!release.progressive) {
    return false;
  }

  let startingPercentage = 100;
  switch (type) {
    case progressiveTypes.RELEASE:
      startingPercentage = release.progressive.percentage;
      break;
    case progressiveTypes.UPDATE:
      startingPercentage = release.revision.release.progressive.percentage;
      break;
    default:
  }

  const [percentage, setPercentage] = useState(
    release.progressive ? release.progressive.percentage : 100
  );
  const revisionInfo = release.revision;
  const channel = release.channel;
  const updatePercentage = percentage => {
    setPercentage(percentage);
    updateProgressiveReleasePercentage(release.progressive.key, percentage);
  };

  let progress;
  if (
    type === progressiveTypes.UPDATE &&
    release.progressive.changes.some(change => change.key === "paused")
  ) {
    const paused = release.progressive.changes.find(
      change => change.key === "paused"
    ).value;
    progress = (
      <Fragment>
        <ProgressiveBar percentage={percentage} />
        <span>{paused ? "Paused" : "Resumed"}</span>
      </Fragment>
    );
  } else {
    progress = (
      <Fragment>
        <InteractiveProgressiveBar
          percentage={startingPercentage}
          onChange={updatePercentage}
          targetPercentage={percentage}
          minPercentage={1}
          singleDirection={type === progressiveTypes.UPDATE ? 1 : 0}
        />
        <span>
          <span className="p-tooltip--btm-right">
            <span className="p-help">{percentage}% of devices</span>
            <span className="p-tooltip__message">
              Releases are delivered to devices via snap refreshes, as such, is
              may
              <br />
              take some time for devices to receive the new version. There is
              also no
              <br />
              guarentee that this release will achieve the entire target
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

    notes = `${100 -
      percentage}% of devices will stay on ${prevRev} (${prevVer})`;
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
};

_ProgressiveRow.propTypes = {
  release: PropTypes.object,
  type: PropTypes.string,
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

const CloseChannelsRow = ({ channels }) => {
  let group = Array.from(channels);
  let last;
  if (channels.length > 1) {
    last = group.pop();
  }
  return (
    <div className="p-releases-confirm-details__row is-closing">
      <span>
        Close{" "}
        {group
          .map(channel => <b key={channel}>{channel}</b>)
          .reduce((acc, el) => {
            return acc === null ? [el] : [...acc, ", ", el];
          }, null)}
        {last ? (
          <Fragment>
            {" "}
            & <b>{last}</b>
          </Fragment>
        ) : (
          ""
        )}
      </span>
    </div>
  );
};

CloseChannelsRow.propTypes = {
  channels: PropTypes.array
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
