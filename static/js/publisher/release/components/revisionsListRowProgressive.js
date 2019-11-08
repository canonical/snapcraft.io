import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  releaseRevision,
  updateProgressiveReleasePercentage,
  pauseProgressiveRelease,
  resumeProgressiveRelease
} from "../actions/pendingReleases";

import { getProgressiveState } from "../selectors";

import { InteractiveProgressiveBar } from "./progressiveBar";

const RevisionsListRowProgressive = ({
  channel,
  architecture,
  revision,
  setDraggable,
  getProgressiveState,
  releaseRevision,
  updateProgressiveReleasePercentage,
  pauseProgressiveRelease,
  resumeProgressiveRelease
}) => {
  const [
    progressiveState,
    previousRevision,
    pendingProgressiveState
  ] = getProgressiveState(channel, architecture, revision.revision);

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

  return (
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
  );
};

RevisionsListRowProgressive.propTypes = {
  channel: PropTypes.string.isRequired,
  architecture: PropTypes.string.isRequired,
  revision: PropTypes.object.isRequired,

  setDraggable: PropTypes.func.isRequired,

  getProgressiveState: PropTypes.func.isRequired,
  releaseRevision: PropTypes.func.isRequired,
  updateProgressiveReleasePercentage: PropTypes.func.isRequired,
  pauseProgressiveRelease: PropTypes.func.isRequired,
  resumeProgressiveRelease: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  getProgressiveState: (channel, arch, revision) =>
    getProgressiveState(state, channel, arch, revision)
});

const mapDispatchToProps = dispatch => {
  return {
    releaseRevision: (revision, channel, progressive) =>
      dispatch(releaseRevision(revision, channel, progressive)),
    updateProgressiveReleasePercentage: (key, percentage) =>
      dispatch(updateProgressiveReleasePercentage(key, percentage)),
    pauseProgressiveRelease: key => dispatch(pauseProgressiveRelease(key)),
    resumeProgressiveRelease: key => dispatch(resumeProgressiveRelease(key))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RevisionsListRowProgressive);
