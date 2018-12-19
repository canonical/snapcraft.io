import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { AVAILABLE } from "../constants";
import { getTrackingChannel, getUnassignedRevisions } from "../releasesState";
import DevmodeIcon, { isInDevmode } from "../devmodeIcon";

import { toggleHistory } from "../actions/history";
import { undoRelease } from "../actions/pendingReleases";

import { getPendingChannelMap } from "../selectors";

function getChannelName(track, risk) {
  return risk === AVAILABLE ? risk : `${track}/${risk}`;
}

class ReleasesTableCell extends Component {
  handleReleaseCellClick(arch, risk, track, event) {
    this.props.toggleHistoryPanel({ arch, risk, track });

    event.preventDefault();
    event.stopPropagation();
  }

  undoClick(revision, track, risk, event) {
    event.stopPropagation();
    this.props.undoRelease(revision, `${track}/${risk}`);
  }

  renderRevision(revision, isPending) {
    return (
      <Fragment>
        {isInDevmode(revision) && (
          <span className="p-release-data__icon">
            <DevmodeIcon revision={revision} showTooltip={false} />
          </span>
        )}
        <span className="p-release-data__info">
          <span className="p-release-data__title">{revision.revision}</span>
          <span className="p-release-data__meta">{revision.version}</span>
        </span>
        <span className="p-tooltip__message">
          {isPending && "Pending release of:"}

          <div className="p-tooltip__group">
            Revision: <b>{revision.revision}</b>
            <br />
            Version: <b>{revision.version}</b>
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
  }

  renderCloseChannel() {
    return (
      <Fragment>
        <em>close channel</em>
        <span className="p-tooltip__message">Pending channel close</span>
      </Fragment>
    );
  }

  renderEmpty(isUnassigned, unassignedCount, trackingChannel) {
    return (
      <Fragment>
        {isUnassigned ? (
          <Fragment>
            <span className="p-release-data__icon">
              <i className="p-icon--plus" />
            </span>
            <span className="p-release-data__info">
              <span className="p-release-data__title">Add revision</span>
              <span className="p-release-data__meta">
                {unassignedCount} available
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
  }

  render() {
    const {
      track,
      risk,
      arch,
      channelMap,
      pendingChannelMap,
      pendingCloses,
      filters,
      revisions
    } = this.props;
    const channel = getChannelName(track, risk);

    // current revision to show (released or pending)
    let currentRevision =
      pendingChannelMap[channel] && pendingChannelMap[channel][arch];
    // already released revision
    let releasedRevision = channelMap[channel] && channelMap[channel][arch];

    // check if there is a pending release in this cell
    const hasPendingRelease =
      currentRevision &&
      (!releasedRevision ||
        releasedRevision.revision !== currentRevision.revision);

    const isChannelPendingClose = pendingCloses.includes(channel);
    const isPending = hasPendingRelease || isChannelPendingClose;
    const isUnassigned = risk === AVAILABLE;
    const isActive = filters && filters.arch === arch && filters.risk === risk;
    const isHighlighted = isPending || (isUnassigned && currentRevision);
    const unassignedCount = getUnassignedRevisions(revisions, arch).length;
    const trackingChannel = getTrackingChannel(channelMap, track, risk, arch);

    const className = [
      "p-releases-table__cell is-clickable",
      isUnassigned ? "is-unassigned" : "",
      isActive ? "is-active" : "",
      isHighlighted ? "is-highlighted" : ""
    ].join(" ");

    return (
      <div
        className={className}
        onClick={this.handleReleaseCellClick.bind(this, arch, risk, track)}
      >
        <div className="p-release-data p-tooltip p-tooltip--btm-center">
          {isChannelPendingClose
            ? this.renderCloseChannel()
            : currentRevision
              ? this.renderRevision(currentRevision, hasPendingRelease)
              : this.renderEmpty(
                  isUnassigned,
                  unassignedCount,
                  trackingChannel
                )}
        </div>
        {hasPendingRelease && (
          <div className="p-release-buttons">
            <button
              className="p-action-button p-tooltip p-tooltip--btm-center"
              onClick={this.undoClick.bind(this, currentRevision, track, risk)}
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
  }
}

ReleasesTableCell.propTypes = {
  // state
  channelMap: PropTypes.object,
  filters: PropTypes.object,
  revisions: PropTypes.object,
  pendingCloses: PropTypes.array,
  pendingChannelMap: PropTypes.object,
  // actions
  toggleHistoryPanel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  // props
  track: PropTypes.string,
  risk: PropTypes.string,
  arch: PropTypes.string
};

const mapStateToProps = state => {
  return {
    channelMap: state.channelMap,
    revisions: state.revisions,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    pendingChannelMap: getPendingChannelMap(state)
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
)(ReleasesTableCell);
