import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { UNASSIGNED } from "../constants";
import { getTrackingChannel, getUnassignedRevisions } from "../releasesState";
import DevmodeIcon, { isInDevmode } from "../devmodeIcon";

import { toggleHistory } from "../actions/history";

function getChannelName(track, risk) {
  return risk === UNASSIGNED ? risk : `${track}/${risk}`;
}

class ReleasesTableCell extends Component {
  getRevisionToDisplay(channelMap, nextReleases, channel, arch) {
    const pendingRelease = nextReleases[channel] && nextReleases[channel][arch];
    const currentRelease = channelMap[channel] && channelMap[channel][arch];

    return pendingRelease || currentRelease;
  }

  handleReleaseCellClick(arch, risk, track, event) {
    this.props.toggleHistoryPanel({ arch, risk, track });

    event.preventDefault();
    event.stopPropagation();
  }

  undoClick(revision, track, risk, event) {
    event.stopPropagation();
    this.props.undoRelease(revision, `${track}/${risk}`);
  }

  renderRevisionCell(
    track,
    risk,
    arch,
    channelMap,
    nextChannelReleases,
    pendingCloses,
    filters,
    revisions
  ) {
    const channel = getChannelName(track, risk);

    let thisRevision = this.getRevisionToDisplay(
      channelMap,
      nextChannelReleases,
      channel,
      arch
    );
    let thisPreviousRevision = channelMap[channel] && channelMap[channel][arch];

    const hasPendingRelease =
      thisRevision &&
      (!thisPreviousRevision ||
        thisPreviousRevision.revision !== thisRevision.revision);

    const isChannelClosed = pendingCloses.includes(channel);
    const isPending = hasPendingRelease || isChannelClosed;
    const trackingChannel = getTrackingChannel(channelMap, track, risk, arch);

    const isUnassigned = risk === UNASSIGNED;
    const isActive = filters && filters.arch === arch && filters.risk === risk;
    const isHighlighted = isPending || (isUnassigned && thisRevision);
    const className = `p-releases-table__cell is-clickable ${
      isUnassigned ? "is-unassigned" : ""
    } ${isActive ? "is-active" : ""} ${isHighlighted ? "is-highlighted" : ""}`;
    const unassignedCount = getUnassignedRevisions(revisions, arch).length;

    return (
      <div
        className={className}
        onClick={this.handleReleaseCellClick.bind(this, arch, risk, track)}
      >
        <div className="p-tooltip p-tooltip--btm-center">
          <span className="p-release-data">
            {thisPreviousRevision &&
              isInDevmode(thisPreviousRevision) &&
              !isPending && (
                <span className="p-release-data__icon">
                  <DevmodeIcon
                    revision={thisPreviousRevision}
                    showTooltip={false}
                  />
                </span>
              )}

            {isPending ? (
              <Fragment>
                <span className="p-release-data__icon">&rarr;</span>
                {hasPendingRelease ? (
                  <span className="p-release-data__info is-pending">
                    <span className="p-release-data__version">
                      {thisRevision.version}
                    </span>
                    <span className="p-release-data__revision">
                      {thisRevision.revision}
                    </span>
                  </span>
                ) : (
                  <em>close channel</em>
                )}
              </Fragment>
            ) : thisPreviousRevision ? (
              <span className="p-release-data__info">
                <span className="p-release-data__version">
                  {thisPreviousRevision.version}
                </span>
                <span className="p-release-data__revision">
                  {thisPreviousRevision.revision}
                </span>
              </span>
            ) : isUnassigned ? (
              <Fragment>
                <span className="p-release-data__icon">
                  <i className="p-icon--plus" />
                </span>
                <span className="p-release-data__info">
                  <span className="p-release-data__version">Add revision</span>
                  <span className="p-release-data__revision">
                    {unassignedCount} available
                  </span>
                </span>
              </Fragment>
            ) : (
              <span className="p-release-data__info--empty">
                {trackingChannel ? "↑" : "–"}
              </span>
            )}
          </span>

          {(hasPendingRelease ||
            isChannelClosed ||
            trackingChannel ||
            (thisPreviousRevision && isInDevmode(thisPreviousRevision))) && (
            <span className="p-tooltip__message">
              {thisPreviousRevision
                ? `${thisPreviousRevision.version} (${
                    thisPreviousRevision.revision
                  })`
                : hasPendingRelease || !trackingChannel
                  ? "None"
                  : `Tracking channel ${trackingChannel}`}
              {hasPendingRelease && (
                <span>
                  {" "}
                  &rarr; {`${thisRevision.version} (${thisRevision.revision})`}
                </span>
              )}
              {isChannelClosed && (
                <span>
                  {" "}
                  &rarr; <em>close channel</em>
                </span>
              )}
              {thisPreviousRevision &&
                isInDevmode(thisPreviousRevision) && (
                  <Fragment>
                    <br />
                    {thisPreviousRevision.confinement === "devmode"
                      ? "confinement: devmode"
                      : "grade: devel"}
                  </Fragment>
                )}
            </span>
          )}
        </div>
        {hasPendingRelease && (
          <div className="p-release-buttons">
            <button
              className="p-action-button p-tooltip p-tooltip--btm-center"
              onClick={this.undoClick.bind(this, thisRevision, track, risk)}
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

  render() {
    const {
      track,
      risk,
      arch,
      channelMap,
      nextReleases,
      pendingCloses,
      filters,
      revisions
    } = this.props;
    return this.renderRevisionCell(
      track,
      risk,
      arch,
      channelMap,
      nextReleases,
      pendingCloses,
      filters,
      revisions
    );
  }
}

ReleasesTableCell.propTypes = {
  // state
  channelMap: PropTypes.object,
  filters: PropTypes.object,
  revisions: PropTypes.object,
  // actions
  toggleHistoryPanel: PropTypes.func.isRequired,
  // non-redux
  nextReleases: PropTypes.object,
  pendingCloses: PropTypes.array,
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
    filters: state.history.filters
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleHistoryPanel: filters => dispatch(toggleHistory(filters))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableCell);
