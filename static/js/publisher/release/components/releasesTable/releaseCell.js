import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { AVAILABLE } from "../../constants";
import { getTrackingChannel } from "../../releasesState";

import HistoryIcon from "../historyIcon";
import { getChannelName } from "../../helpers";
import { DND_ITEM_REVISIONS } from "../dnd";

import { toggleHistory } from "../../actions/history";
import { undoRelease } from "../../actions/pendingReleases";

import {
  getPendingChannelMap,
  getFilteredAvailableRevisionsForArch,
  getRevisionsFromBuild,
  getProgressiveState,
  hasPendingRelease
} from "../../selectors";

import {
  ReleasesTableCellView,
  RevisionInfo,
  EmptyInfo,
  CloseChannelInfo,
  UnassignedInfo
} from "./cellViews";

// releases table cell with data from channel map release
const ReleasesTableReleaseCell = props => {
  const {
    track,
    risk,
    arch,
    branch,
    channelMap,
    pendingChannelMap,
    pendingCloses,
    filters,
    isOverParent,
    showVersion,
    getAvailableCount,
    hasPendingRelease,
    undoRelease,
    toggleHistoryPanel,
    getProgressiveState
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(track, risk, branchName);

  // current revision to show from channel map (released or pending)
  const currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];

  // check if there is a pending release in this cell
  const pendingRelease = hasPendingRelease(channel, arch);

  let progressiveState;
  let previousRevision;
  let pendingProgressiveState;

  if (!pendingRelease && currentRevision) {
    [
      progressiveState,
      previousRevision,
      pendingProgressiveState
    ] = getProgressiveState(channel, arch, currentRevision.revision);
  }

  const isChannelPendingClose = pendingCloses.includes(channel);
  const isPending =
    pendingRelease || isChannelPendingClose || pendingProgressiveState;
  const isUnassigned = risk === AVAILABLE;
  const isActive =
    filters &&
    filters.arch === arch &&
    filters.risk === risk &&
    filters.branch === branchName;
  const isHighlighted = isPending || (isUnassigned && currentRevision);

  const canDrag = currentRevision && !isChannelPendingClose;

  // When we're dragging and dropping, we really don't want to persist the
  // progressive state, so reset it here
  let dndRevision;
  if (currentRevision) {
    dndRevision = JSON.parse(JSON.stringify(currentRevision));
    if (dndRevision.release && dndRevision.release.progressive) {
      dndRevision.release.progressive = {
        key: null,
        percentage: 100,
        paused: false
      };
    }
  }

  const item = {
    revisions: [dndRevision],
    architectures: currentRevision ? currentRevision.architectures : [],
    risk,
    branch,
    type: DND_ITEM_REVISIONS
  };

  function handleHistoryIconClick(arch, risk, track, branchName) {
    toggleHistoryPanel({ arch, risk, track, branch: branchName });
  }

  function undoClick(revision, channel, event) {
    event.stopPropagation();
    undoRelease(revision, channel);
  }

  const className = [
    isUnassigned ? "is-unassigned" : "",
    isActive ? "is-active" : "",
    isHighlighted ? "is-highlighted" : "",
    isPending ? "is-pending" : "",
    isOverParent ? "is-over" : ""
  ].join(" ");

  const actionsNode = pendingRelease ? (
    <div className="p-release-buttons">
      <button
        className="p-action-button p-tooltip p-tooltip--btm-center"
        onClick={undoClick.bind(this, currentRevision, channel)}
      >
        <i className="p-icon--close" />
        <span className="p-tooltip__message">
          Cancel promoting this revision
        </span>
      </button>
    </div>
  ) : null;

  let cellInfoNode = null;

  if (isChannelPendingClose) {
    cellInfoNode = <CloseChannelInfo />;
  } else if (currentRevision) {
    cellInfoNode = (
      <RevisionInfo
        revision={currentRevision}
        isPending={pendingRelease ? true : false}
        showVersion={showVersion}
        progressiveState={progressiveState}
        previousRevision={previousRevision ? previousRevision.revision : null}
        pendingProgressiveState={pendingProgressiveState}
      />
    );
  } else if (isUnassigned) {
    cellInfoNode = <UnassignedInfo availableCount={getAvailableCount(arch)} />;
  } else {
    cellInfoNode = (
      <EmptyInfo
        trackingChannel={getTrackingChannel(channelMap, track, risk, arch)}
      />
    );
  }

  return (
    <ReleasesTableCellView
      actions={actionsNode}
      item={item}
      canDrag={canDrag}
      className={className}
    >
      {cellInfoNode}
      <HistoryIcon
        onClick={handleHistoryIconClick.bind(
          this,
          arch,
          risk,
          track,
          branchName
        )}
      />
      {!isChannelPendingClose &&
        pendingProgressiveState &&
        pendingProgressiveState.percentage && (
          <span
            className="p-release__progressive-pending-percentage"
            style={{
              width: `${pendingProgressiveState.percentage}%`
            }}
          />
        )}
      {!isChannelPendingClose &&
        progressiveState &&
        progressiveState.percentage && (
          <span
            className="p-release__progressive-percentage"
            style={{ width: `${progressiveState.percentage}%` }}
          />
        )}
    </ReleasesTableCellView>
  );
};

ReleasesTableReleaseCell.propTypes = {
  // state
  channelMap: PropTypes.object,
  filters: PropTypes.object,
  pendingCloses: PropTypes.array,
  pendingChannelMap: PropTypes.object,
  // compute state
  getAvailableCount: PropTypes.func,
  hasPendingRelease: PropTypes.func,
  getRevisionsFromBuild: PropTypes.func,
  getProgressiveState: PropTypes.func,
  // actions
  toggleHistoryPanel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  // props
  track: PropTypes.string,
  risk: PropTypes.string,
  arch: PropTypes.string,
  showVersion: PropTypes.bool,
  branch: PropTypes.object,
  isOverParent: PropTypes.bool,

  revision: PropTypes.object
};

const mapStateToProps = state => {
  return {
    channelMap: state.channelMap,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    pendingChannelMap: getPendingChannelMap(state),
    getAvailableCount: arch =>
      getFilteredAvailableRevisionsForArch(state, arch).length,
    getRevisionsFromBuild: buildId => getRevisionsFromBuild(state, buildId),
    getProgressiveState: (channel, arch, revision) =>
      getProgressiveState(state, channel, arch, revision),
    hasPendingRelease: (channel, arch) =>
      hasPendingRelease(state, channel, arch)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleHistoryPanel: filters => dispatch(toggleHistory(filters)),
    undoRelease: (revision, channel) => dispatch(undoRelease(revision, channel))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableReleaseCell);
