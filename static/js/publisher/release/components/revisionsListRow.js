import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import distanceInWords from "date-fns/distance_in_words_strict";
import format from "date-fns/format";

import { getChannelString } from "../../../libs/channels";
import { useDragging, DND_ITEM_REVISIONS, Handle } from "./dnd";
import { toggleRevision } from "../actions/channelMap";
import {
  releaseRevision,
  updateProgressiveReleasePercentage,
  pauseProgressiveRelease,
  resumeProgressiveRelease
} from "../actions/pendingReleases";
import {
  getSelectedRevisions,
  getProgressiveState,
  isProgressiveReleaseEnabled
} from "../selectors";

import RevisionLabel from "./revisionLabel";
import { InteractiveProgressiveBar } from "./progressiveBar";

const RevisionsListRow = props => {
  const {
    index,
    revision,
    isSelectable,
    showChannels,
    showBuildRequest,
    isPending,
    isActive,
    getProgressiveState,
    isProgressiveReleaseEnabled,
    updateProgressiveReleasePercentage,
    releaseRevision,
    pauseProgressiveRelease,
    resumeProgressiveRelease
  } = props;

  const [canDrag, setDraggable] = useState(true);

  const revisionDate = revision.release
    ? new Date(revision.release.when)
    : new Date(revision.created_at);

  const isSelected = props.selectedRevisions.includes(revision.revision);

  let channel;
  if (revision.release) {
    channel = getChannelString(revision.release);
  }

  function revisionSelectChange() {
    props.toggleRevision(revision);
  }

  let progressiveState;
  let previousRevision;
  let pendingProgressiveState;

  // Only show the progressive release status if it's the latest revision
  if (index === 0 && revision.release) {
    [
      progressiveState,
      previousRevision,
      pendingProgressiveState
    ] = getProgressiveState(
      channel,
      revision.release.architecture,
      revision.revision
    );
  }

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revisions: [revision],
      architectures: revision.architectures,
      type: DND_ITEM_REVISIONS
    },
    canDrag: canDrag
  });

  const id = `revision-check-${revision.revision}`;
  const className = `p-revisions-list__row is-draggable ${
    isActive ? "is-active" : ""
  } ${isSelectable ? "is-clickable" : ""} ${
    isPending || isSelected ? "is-pending" : ""
  } ${isGrabbing ? "is-grabbing" : ""} ${isDragging ? "is-dragging" : ""}`;

  const buildRequestId =
    revision.attributes && revision.attributes["build-request-id"];

  const showProgressiveReleases = isProgressiveReleaseEnabled && !showChannels;

  const handlePauseProgressiveRelease = () => {
    releaseRevision(revision, channel, progressiveState);
    pauseProgressiveRelease(progressiveState.key);
  };

  const handleResumeProgressiveRelease = () => {
    if (!pendingProgressiveState) {
      releaseRevision(revision, channel, progressiveState);
    }
    resumeProgressiveRelease(progressiveState.key);
  };

  const handleCancelProgressiveRelease = () => {
    releaseRevision(previousRevision, channel, null);
  };

  const handleProgressiveChange = percentage => {
    if (!pendingProgressiveState) {
      releaseRevision(revision, channel, progressiveState);
    }
    updateProgressiveReleasePercentage(progressiveState.key, percentage);
  };

  let showProgressivePause = false;
  let showProgressiveResume = false;

  if (progressiveState) {
    if (progressiveState.paused) {
      showProgressiveResume = true;
    } else {
      showProgressivePause = true;
    }
  }

  if (pendingProgressiveState) {
    if (pendingProgressiveState.paused) {
      showProgressivePause = false;
      showProgressiveResume = true;
    } else {
      showProgressivePause = true;
      showProgressiveResume = false;
    }
  }

  return (
    <tr
      ref={drag}
      key={id}
      className={className}
      onClick={isSelectable ? revisionSelectChange : null}
    >
      <td>
        <Handle />
      </td>
      <td>
        {isSelectable ? (
          <Fragment>
            <input
              type="checkbox"
              checked={isSelected}
              id={id}
              onChange={revisionSelectChange}
            />
            <label
              className="p-revisions-list__revision is-inline-label"
              htmlFor={id}
            >
              <RevisionLabel revision={revision} showTooltip={true} />
            </label>
          </Fragment>
        ) : (
          <span className="p-revisions-list__revision">
            <RevisionLabel revision={revision} showTooltip={true} />
          </span>
        )}
      </td>
      <td>{revision.version}</td>
      {showBuildRequest && (
        <td>
          {buildRequestId && (
            <Fragment>
              <i className="p-icon--lp" /> {buildRequestId}
            </Fragment>
          )}
        </td>
      )}
      {showProgressiveReleases && (
        <td>
          {progressiveState && (
            <div
              className="p-revisions-list__revision-progressive"
              onMouseOver={() => setDraggable(false)}
              onMouseOut={() => setDraggable(true)}
            >
              {showProgressivePause && (
                <span
                  className="p-progressive__pause p-tooltip--btm-center"
                  aria-describedby={`${revision.revision}-pause`}
                  onClick={handlePauseProgressiveRelease}
                >
                  <i className="p-icon--pause" />
                  <span
                    className="p-tooltip__message"
                    role="tooltip"
                    id={`${revision.revision}-pause`}
                  >
                    Pause progressive release of <b>{revision.revision}</b>
                  </span>
                </span>
              )}
              {showProgressiveResume && (
                <span
                  className="p-progressive__pause p-tooltip--btm-center"
                  aria-describedby={`${revision.revision}-resume`}
                  onClick={handleResumeProgressiveRelease}
                >
                  <i className="p-icon--resume" />
                  <span
                    className="p-tooltip__message"
                    role="tooltip"
                    id={`${revision.revision}-resume`}
                  >
                    Resume progressive release of <b>{revision.revision}</b>
                  </span>
                </span>
              )}
              <InteractiveProgressiveBar
                percentage={progressiveState.percentage}
                targetPercentage={
                  pendingProgressiveState
                    ? pendingProgressiveState.percentage
                    : null
                }
                singleDirection={1}
                onChange={handleProgressiveChange}
                disabled={showProgressiveResume}
              />
              {previousRevision && (
                <span
                  className="p-progressive__cancel p-tooltip--btm-center"
                  aria-describedby={`${revision.revision}-cancel`}
                >
                  <i
                    className="p-icon--close"
                    onClick={handleCancelProgressiveRelease}
                  />
                  <span
                    className="p-tooltip__message"
                    role="tooltip"
                    id={`${revision.revision}-cancel`}
                  >
                    Cancel progressive release and revert all devices to{" "}
                    <b>{previousRevision.revision}</b>
                  </span>
                </span>
              )}
            </div>
          )}
        </td>
      )}
      {showChannels && <td>{revision.channels.join(", ")}</td>}
      <td className="u-align--right">
        {isPending ? (
          <em>pending release</em>
        ) : (
          <span
            className="p-tooltip p-tooltip--btm-center"
            aria-describedby={`revision-uploaded-${revision.revision}`}
          >
            {distanceInWords(new Date(), revisionDate, { addSuffix: true })}
            <span
              className="p-tooltip__message u-align--center"
              role="tooltip"
              id={`revision-uploaded-${revision.revision}`}
            >
              {format(revisionDate, "YYYY-MM-DD HH:mm")}
            </span>
          </span>
        )}
      </td>
    </tr>
  );
};

RevisionsListRow.propTypes = {
  // props
  index: PropTypes.number.isRequired,
  revision: PropTypes.object.isRequired,
  isSelectable: PropTypes.bool,
  showChannels: PropTypes.bool,
  isPending: PropTypes.bool,
  isActive: PropTypes.bool,
  showBuildRequest: PropTypes.bool.isRequired,

  // computed state (selectors)
  selectedRevisions: PropTypes.array.isRequired,
  getProgressiveState: PropTypes.func,
  isProgressiveReleaseEnabled: PropTypes.bool,

  // actions
  toggleRevision: PropTypes.func.isRequired,
  updateProgressiveReleasePercentage: PropTypes.func.isRequired,
  releaseRevision: PropTypes.func.isRequired,
  pauseProgressiveRelease: PropTypes.func.isRequired,
  resumeProgressiveRelease: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    selectedRevisions: getSelectedRevisions(state),
    getProgressiveState: (channel, arch, revision) =>
      getProgressiveState(state, channel, arch, revision),
    isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleRevision: revision => dispatch(toggleRevision(revision)),
    updateProgressiveReleasePercentage: (key, percentage) =>
      dispatch(updateProgressiveReleasePercentage(key, percentage)),
    releaseRevision: (revision, channel, progressive) =>
      dispatch(releaseRevision(revision, channel, progressive)),
    pauseProgressiveRelease: key => dispatch(pauseProgressiveRelease(key)),
    resumeProgressiveRelease: key => dispatch(resumeProgressiveRelease(key))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RevisionsListRow);
