import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { AVAILABLE } from "../constants";
import { getTrackingChannel } from "../releasesState";
import DevmodeRevision from "./devmodeRevision";
import HistoryIcon from "./historyIcon";
import {
  getChannelName,
  isInDevmode,
  isRevisionBuiltOnLauchpad,
  getBuildId,
  getRevisionsArchitectures
} from "../helpers";
import { useDragging, DND_ITEM_REVISIONS, Handle } from "./dnd";

import { toggleHistory } from "../actions/history";
import { promoteRevision, undoRelease } from "../actions/pendingReleases";

import {
  getPendingChannelMap,
  getFilteredAvailableRevisionsForArch,
  hasPendingRelease,
  getRevisionsFromBuild
} from "../selectors";

const CloseChannelInfo = () => (
  <Fragment>
    close channel
    <span className="p-tooltip__message">Pending channel close</span>
  </Fragment>
);

const EmptyInfo = ({ isUnassigned, availableCount, trackingChannel }) => {
  return (
    <Fragment>
      {isUnassigned ? (
        <Fragment>
          <span className="p-release-data__info">
            <span className="p-release-data__title">Add revision</span>
            <span className="p-release-data__meta">
              {availableCount} available
            </span>
          </span>
        </Fragment>
      ) : (
        <Fragment>
          <span className="p-release-data__info--empty">
            {trackingChannel ? "↑" : "–"}
          </span>
        </Fragment>
      )}
      {!isUnassigned && (
        <span className="p-tooltip__message">
          {trackingChannel
            ? `Tracking channel ${trackingChannel}`
            : "Nothing currently released"}
        </span>
      )}
    </Fragment>
  );
};

EmptyInfo.propTypes = {
  isUnassigned: PropTypes.bool,
  availableCount: PropTypes.number,
  trackingChannel: PropTypes.string
};

const RevisionInfo = ({ revision, isPending, showVersion }) => {
  let buildIcon = null;

  if (isRevisionBuiltOnLauchpad(revision)) {
    buildIcon = <i className="p-icon--lp" />;
  }

  return (
    <Fragment>
      <span className="p-release-data__info">
        <span className="p-release-data__title">
          <DevmodeRevision revision={revision} showTooltip={false} />
        </span>
        {showVersion && (
          <span className="p-release-data__meta">{revision.version}</span>
        )}
      </span>
      <span className="p-tooltip__message">
        {isPending && "Pending release of:"}

        <div className="p-tooltip__group">
          Revision: <b>{revision.revision}</b>
          <br />
          Version: <b>{revision.version}</b>
          {revision.attributes &&
            revision.attributes["build-request-id"] && (
              <Fragment>
                <br />
                Build: {buildIcon}{" "}
                <b>{revision.attributes["build-request-id"]}</b>
              </Fragment>
            )}
          {isInDevmode(revision) && (
            <Fragment>
              <br />
              {revision.confinement === "devmode" ? (
                <Fragment>
                  Confinement: <b>devmode</b>
                </Fragment>
              ) : (
                <Fragment>
                  Grade: <b>devel</b>
                </Fragment>
              )}
            </Fragment>
          )}
        </div>

        {isInDevmode(revision) && (
          <div className="p-tooltip__group">
            Revisions in devmode can’t be promoted
            <br />
            to stable or candidate channels.
          </div>
        )}
      </span>
    </Fragment>
  );
};

RevisionInfo.propTypes = {
  revision: PropTypes.object,
  isPending: PropTypes.bool,
  showVersion: PropTypes.bool
};

const ReleasesTableCell = props => {
  const {
    track,
    risk,
    arch,
    branch,
    channelMap,
    pendingChannelMap,
    pendingCloses,
    filters,
    isOverParent
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(track, risk, branchName);

  // current revision to show (released or pending)
  const currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];

  // check if there is a pending release in this cell
  const hasPendingRelease = props.hasPendingRelease(channel, arch);

  const isChannelPendingClose = pendingCloses.includes(channel);
  const isPending = hasPendingRelease || isChannelPendingClose;
  const isUnassigned = risk === AVAILABLE;
  const isActive =
    filters &&
    filters.arch === arch &&
    filters.risk === risk &&
    filters.branch === branchName;
  const isHighlighted = isPending || (isUnassigned && currentRevision);
  const trackingChannel = getTrackingChannel(channelMap, track, risk, arch);
  const availableCount = props.getAvailableCount(arch);

  const buildId = getBuildId(currentRevision);
  let buildSet = [];

  if (buildId) {
    buildSet = props.getRevisionsFromBuild(buildId);
  } else if (currentRevision) {
    buildSet = [currentRevision];
  }

  const canDrag = currentRevision && !isChannelPendingClose;

  const item = {
    revisions: buildSet,
    architectures: getRevisionsArchitectures(buildSet),
    risk,
    branch,
    type: DND_ITEM_REVISIONS
  };

  const [isDragging, isGrabbing, drag] = useDragging({
    item,
    canDrag
  });

  function handleHistoryIconClick(arch, risk, track, branchName) {
    props.toggleHistoryPanel({ arch, risk, track, branch: branchName });
  }

  function undoClick(revision, channel, event) {
    event.stopPropagation();
    props.undoRelease(revision, channel);
  }

  const className = [
    "p-releases-table__cell",
    isUnassigned ? "is-unassigned" : "",
    isActive ? "is-active" : "",
    isHighlighted ? "is-highlighted" : "",
    isPending ? "is-pending" : "",
    isGrabbing ? "is-grabbing" : "",
    isDragging ? "is-dragging" : "",
    canDrag ? "is-draggable" : "",
    isOverParent ? "is-over" : ""
  ].join(" ");

  return (
    <div className={className}>
      <div
        ref={drag}
        className="p-release-data p-tooltip p-tooltip--btm-center"
      >
        <Handle />
        {isChannelPendingClose ? (
          <CloseChannelInfo />
        ) : currentRevision ? (
          <RevisionInfo
            revision={currentRevision}
            isPending={hasPendingRelease}
            showVersion={props.showVersion}
          />
        ) : (
          <EmptyInfo
            isUnassigned={isUnassigned}
            availableCount={availableCount}
            trackingChannel={trackingChannel}
          />
        )}
        <HistoryIcon
          onClick={handleHistoryIconClick.bind(
            this,
            arch,
            risk,
            track,
            branchName
          )}
        />
      </div>
      {hasPendingRelease && (
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
      )}
    </div>
  );
};

ReleasesTableCell.propTypes = {
  // state
  channelMap: PropTypes.object,
  filters: PropTypes.object,
  pendingCloses: PropTypes.array,
  pendingChannelMap: PropTypes.object,
  // compute state
  getAvailableCount: PropTypes.func,
  hasPendingRelease: PropTypes.func,
  getRevisionsFromBuild: PropTypes.func,
  // actions
  toggleHistoryPanel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  // props
  track: PropTypes.string,
  risk: PropTypes.string,
  arch: PropTypes.string,
  showVersion: PropTypes.bool,
  branch: PropTypes.object,
  isOverParent: PropTypes.bool
};

const mapStateToProps = state => {
  return {
    channelMap: state.channelMap,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    pendingChannelMap: getPendingChannelMap(state),
    getAvailableCount: arch =>
      getFilteredAvailableRevisionsForArch(state, arch).length,
    hasPendingRelease: (channel, arch) =>
      hasPendingRelease(state, channel, arch),
    getRevisionsFromBuild: buildId => getRevisionsFromBuild(state, buildId)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleHistoryPanel: filters => dispatch(toggleHistory(filters)),
    undoRelease: (revision, channel) =>
      dispatch(undoRelease(revision, channel)),
    promoteRevision: (revision, channel) =>
      dispatch(promoteRevision(revision, channel))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableCell);
